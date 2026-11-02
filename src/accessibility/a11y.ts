/**
 * Utilidades de accesibilidad.
 * El estado de verificación se comunica con texto + icono, no solo color.
 */

import type { SegmentStatus } from '@/catalog/types';
import type { TranslationKey } from '@/i18n/es';

export interface StatusVisual {
  icon: string;
  labelKey: TranslationKey;
  className: string;
}

/** Icono y etiqueta de texto para cada estado de verificación. */
export function getStatusVisual(status: SegmentStatus): StatusVisual {
  switch (status) {
    case 'verified':
      return { icon: '\u2705', labelKey: 'status.verified', className: 'status-verified' };
    case 'aging':
      return { icon: '\u23F0', labelKey: 'status.aging', className: 'status-aging' };
    case 'unverified':
      return { icon: '\u274C', labelKey: 'status.unverified', className: 'status-unverified' };
    case 'retired':
      return { icon: '\u26D4', labelKey: 'status.retired', className: 'status-retired' };
    default:
      return { icon: '\u2753', labelKey: 'status.unverified', className: 'status-unknown' };
  }
}

/** Distancia haversine en metros entre dos coordenadas. */
export function haversineMeters(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371000; // radio terrestre en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/** Formatea metros a texto legible. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
