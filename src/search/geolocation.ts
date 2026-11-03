/**
 * Geolocalización opcional local.
 * Se solicita solo cuando el usuario toca explícitamente "Usar mi ubicación".
 * Se procesa exclusivamente en el dispositivo: no se almacena ni transmite.
 */

import type { Stop, CityConfig } from '@/catalog/types';
import { findNearestStop, haversineMeters, type Graph } from '@/routing/graph';
import { getCityConfig } from '@/catalog/config';

export interface GeoResult {
  stop: Stop | undefined;
  lat: number;
  lon: number;
  distanceMeters: number | undefined;
}

export type GeoError =
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'empty-catalog'
  | 'out-of-bounds';

export interface LocationResponse {
  ok: boolean;
  result?: GeoResult;
  error?: GeoError;
  detectedCoords?: { lat: number; lon: number };
}

/**
 * Solicita la geolocalización del usuario y ubica el paradero verificado más cercano.
 * Verifica si las coordenadas se encuentran dentro del área del piloto de Chiclayo.
 */
export function requestLocation(
  graph: Graph,
  cityConfig: CityConfig = getCityConfig()
): Promise<LocationResponse> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ ok: false, error: 'unavailable' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (graph.stopMap.size === 0) {
          resolve({ ok: false, error: 'empty-catalog' });
          return;
        }

        // Verificar si las coordenadas están dentro del radio del piloto de Chiclayo
        const inBounds =
          latitude >= cityConfig.bounds.minLat &&
          latitude <= cityConfig.bounds.maxLat &&
          longitude >= cityConfig.bounds.minLon &&
          longitude <= cityConfig.bounds.maxLon;

        const stop = findNearestStop(graph, latitude, longitude);
        const distanceMeters = stop
          ? haversineMeters(latitude, longitude, stop.lat, stop.lon)
          : undefined;

        if (!inBounds || (distanceMeters !== undefined && distanceMeters > 35000)) {
          resolve({
            ok: false,
            error: 'out-of-bounds',
            detectedCoords: { lat: latitude, lon: longitude },
            result: { stop, lat: latitude, lon: longitude, distanceMeters },
          });
          return;
        }

        resolve({
          ok: true,
          result: { stop, lat: latitude, lon: longitude, distanceMeters },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, error: 'denied' });
        } else if (err.code === err.TIMEOUT) {
          resolve({ ok: false, error: 'timeout' });
        } else {
          resolve({ ok: false, error: 'unavailable' });
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );
  });
}
