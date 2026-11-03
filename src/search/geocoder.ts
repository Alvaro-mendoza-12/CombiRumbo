/**
 * Geocodificador híbrido para CombiRumbo.
 * 1. Consulta primero el directorio curado de POIs locales (ultra-rápido, 0ms, sin red).
 * 2. Si no hay suficientes coincidencias o es una calle/dirección, consulta OSM Nominatim
 *    restringido al bounding box de la ciudad activa, con caché en memoria y debouncing.
 */

import type { Place } from '@/catalog/types';
import { getCityConfig } from '@/catalog/config';
import { searchLocalPlaces } from './places';

// Caché en memoria para evitar llamadas redundantes a Nominatim
const geocodeCache = new Map<string, Place[]>();

export interface GeocodeOptions {
  cityId?: string;
  limit?: number;
}

/**
 * Busca lugares y direcciones combinando el directorio de POIs y OSM Nominatim.
 */
export async function searchPlaces(
  query: string,
  options: GeocodeOptions = {}
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cityId = options.cityId || 'chiclayo';
  const limit = options.limit || 8;
  const cacheKey = `${cityId}:${q.toLowerCase()}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Resultados locales del directorio curado (inmediato)
  const localMatches = searchLocalPlaces(q, cityId);

  // Si ya tenemos suficientes coincidencias locales de alta relevancia (por ejemplo "usmp", "usat", "mercado"),
  // devolvemos los resultados de inmediato sin esperar a la red.
  if (localMatches.length >= 3 && q.length < 6) {
    geocodeCache.set(cacheKey, localMatches.slice(0, limit));
    return localMatches.slice(0, limit);
  }

  // 2. Consulta a OpenStreetMap Nominatim (con timeout de 2.5s y manejo seguro de errores)
  try {
    const cityConfig = getCityConfig(cityId);
    const { minLon, minLat, maxLon, maxLat } = cityConfig.bounds;
    const viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${q}, ${cityConfig.name}, ${cityConfig.country}`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('viewbox', viewbox);
    url.searchParams.set('bounded', '1');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(limit));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CombiRumbo-TransitApp-Hackathon/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        type?: string;
        class?: string;
      }> = await response.json();

      const osmPlaces: Place[] = data.map((item) => ({
        id: `osm-${item.place_id}`,
        cityId,
        name: item.display_name.split(',')[0]?.trim() || item.display_name,
        shortName: item.display_name.split(',')[0]?.trim(),
        category: mapOsmTypeToCategory(item.type, item.class),
        address: item.display_name,
        landmarkContext: item.display_name.split(',').slice(1, 3).join(',').trim(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        aliases: [item.display_name.toLowerCase()],
        isVerifiedTransitStop: false,
      }));

      // Fusionar evitando duplicados por proximidad (< 50 metros)
      const merged = [...localMatches];
      for (const osm of osmPlaces) {
        const alreadyExists = merged.some(
          (m) =>
            Math.abs(m.lat - osm.lat) < 0.0005 &&
            Math.abs(m.lon - osm.lon) < 0.0005
        );
        if (!alreadyExists) {
          merged.push(osm);
        }
      }

      const results = merged.slice(0, limit);
      geocodeCache.set(cacheKey, results);
      return results;
    }
  } catch {
    // Si la llamada externa falla (offline o timeout), usamos solo el directorio local
  }

  const fallback = localMatches.slice(0, limit);
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

function mapOsmTypeToCategory(type?: string, osmClass?: string): Place['category'] {
  if (type === 'university' || type === 'college' || type === 'school') return 'university';
  if (type === 'hospital' || type === 'clinic' || type === 'pharmacy') return 'health';
  if (type === 'supermarket' || type === 'marketplace' || osmClass === 'shop') return 'market';
  if (type === 'bus_stop' || type === 'station' || type === 'bus_station') return 'transit-hub';
  if (type === 'beach') return 'beach';
  if (type === 'park' || type === 'townhall') return 'center';
  return 'general';
}
