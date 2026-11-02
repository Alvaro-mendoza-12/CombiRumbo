/**
 * Geolocalización opcional.
 * Se solicita solo al tocar "Usar mi ubicación".
 * Se procesa localmente: no se guarda ni envía al servidor.
 */

import type { Stop } from '@/catalog/types';
import { findNearestStop, haversineMeters, type Graph } from '@/routing/graph';

export interface GeoResult {
  stop: Stop | undefined;
  lat: number;
  lon: number;
  distanceMeters: number | undefined;
}

export type GeoError = 'denied' | 'unavailable' | 'timeout' | 'empty-catalog';

/**
 * Solicita la geolocalización del usuario y busca el paradero más cercano.
 * No guarda ni envía las coordenadas.
 */
export function requestLocation(
  graph: Graph
): Promise<{ ok: true; result: GeoResult } | { ok: false; error: GeoError }> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ ok: false, error: 'unavailable' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // El catálogo está vacío: no hay paraderos cercanos.
        if (graph.stopMap.size === 0) {
          resolve({ ok: false, error: 'empty-catalog' });
          return;
        }
        const stop = findNearestStop(graph, latitude, longitude);
        const distanceMeters = stop
          ? haversineMeters(latitude, longitude, stop.lat, stop.lon)
          : undefined;
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
