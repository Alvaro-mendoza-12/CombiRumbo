/**
 * Configuración central del catálogo y de ciudades.
 * La ventana de vigencia, límites por ciudad y caducidad de reportes
 * se controlan aquí, sin duplicarse en pantallas.
 */

import type { CityConfig } from './types';

/** Configuración de Chiclayo: único piloto activo de esta entrega. */
export const CHICLAYO_CITY_CONFIG: CityConfig = {
  id: 'chiclayo',
  name: 'Chiclayo',
  country: 'Perú',
  boundingCenter: [-6.7715, -79.8400],
  bounds: {
    minLat: -7.0,
    maxLat: -6.5,
    minLon: -80.0,
    maxLon: -79.2,
  },
  pilotStatus: 'active-pilot',
};

/** Mapa de configuración de ciudades. Admite registrar ciudades futuras sin tocar la lógica. */
export const SUPPORTED_CITIES: Record<string, CityConfig> = {
  chiclayo: CHICLAYO_CITY_CONFIG,
};

export const DEFAULT_CITY_ID = 'chiclayo';

/** Devuelve la configuración de la ciudad especificada o Chiclayo por defecto. */
export function getCityConfig(cityId: string = DEFAULT_CITY_ID): CityConfig {
  return SUPPORTED_CITIES[cityId] ?? CHICLAYO_CITY_CONFIG;
}

export const CATALOG_CONFIG = {
  /** Días tras los cuales un segmento 'verified' pasa a 'aging'. */
  reviewWindowDays: 30,

  /** Minutos de caducidad de un reporte temporal de pasajero. */
  reportExpiryMinutes: 20,

  /** Máximo de reportes por ruta por bucket de 5 minutos (anti-spam). */
  maxReportsPerBucket: 10,

  /** Tamaño del bucket de rate limit en minutos. */
  rateLimitBucketMinutes: 5,
} as const;

/**
 * Calcula la fecha de revisión (reviewAfter) a partir de una fecha de verificación.
 */
export function computeReviewAfter(verifiedAt: string): string {
  const date = new Date(verifiedAt);
  date.setDate(date.getDate() + CATALOG_CONFIG.reviewWindowDays);
  return date.toISOString();
}

/**
 * Verifica si una fecha de revisión ya venció respecto a 'now'.
 */
export function isReviewExpired(reviewAfter: string, now: Date = new Date()): boolean {
  return new Date(reviewAfter) < now;
}
