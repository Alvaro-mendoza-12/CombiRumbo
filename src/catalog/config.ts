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
  countryCode: 'PE',
  flag: '🇵🇪',
  currency: 'PEN',
  currencySymbol: 'S/',
  boundingCenter: [-6.7715, -79.8400],
  bounds: {
    minLat: -7.0,
    maxLat: -6.5,
    minLon: -80.0,
    maxLon: -79.2,
  },
  defaultZoom: 13,
  pilotStatus: 'active-pilot',
  coverageSummary: 'Piloto Activo: 100% verificado en campo (Eje Pimentel y Eje Balta/Moshoqueque).',
  transportModes: ['Combis', 'Micros', 'Colectivos'],
};

export const LIMA_CITY_CONFIG: CityConfig = {
  id: 'lima',
  name: 'Lima',
  country: 'Perú',
  countryCode: 'PE',
  flag: '🇵🇪',
  currency: 'PEN',
  currencySymbol: 'S/',
  boundingCenter: [-12.0464, -77.0428],
  bounds: {
    minLat: -12.35,
    maxLat: -11.75,
    minLon: -77.25,
    maxLon: -76.75,
  },
  defaultZoom: 12,
  pilotStatus: 'planned',
  coverageSummary: 'Próximamente: En preparación de protocolos de campo para líneas metropolitanas.',
  transportModes: ['Metropolitano', 'Corredores', 'Combis tradicionales'],
};

export const BOGOTA_CITY_CONFIG: CityConfig = {
  id: 'bogota',
  name: 'Bogotá',
  country: 'Colombia',
  countryCode: 'CO',
  flag: '🇨🇴',
  currency: 'COP',
  currencySymbol: '$',
  boundingCenter: [4.7110, -74.0721],
  bounds: {
    minLat: 4.45,
    maxLat: 4.85,
    minLon: -74.25,
    maxLon: -73.95,
  },
  defaultZoom: 12,
  pilotStatus: 'planned',
  coverageSummary: 'Próximamente: Fase de mapeo inicial de troncales y rutas zonales.',
  transportModes: ['TransMilenio', 'SITP', 'Busetas'],
};

export const CDMX_CITY_CONFIG: CityConfig = {
  id: 'cdmx',
  name: 'Ciudad de México',
  country: 'México',
  countryCode: 'MX',
  flag: '🇲🇽',
  currency: 'MXN',
  currencySymbol: '$',
  boundingCenter: [19.4326, -99.1332],
  bounds: {
    minLat: 19.20,
    maxLat: 19.60,
    minLon: -99.35,
    maxLon: -98.95,
  },
  defaultZoom: 12,
  pilotStatus: 'planned',
  coverageSummary: 'Próximamente: Protocolos para peseros, microbuses y Metrobús.',
  transportModes: ['Metrobús', 'Microbuses / Peseros', 'Trolebús'],
};

export const BUENOSAIRES_CITY_CONFIG: CityConfig = {
  id: 'buenosaires',
  name: 'Buenos Aires',
  country: 'Argentina',
  countryCode: 'AR',
  flag: '🇦🇷',
  currency: 'ARS',
  currencySymbol: '$',
  boundingCenter: [-34.6037, -58.3816],
  bounds: {
    minLat: -34.72,
    maxLat: -34.52,
    minLon: -58.55,
    maxLon: -58.33,
  },
  defaultZoom: 12,
  pilotStatus: 'planned',
  coverageSummary: 'Próximamente: Integración de líneas de colectivos y subte.',
  transportModes: ['Colectivos', 'Subte', 'Trenes'],
};

/** Mapa de configuración de ciudades. */
export const SUPPORTED_CITIES: Record<string, CityConfig> = {
  chiclayo: CHICLAYO_CITY_CONFIG,
  lima: LIMA_CITY_CONFIG,
  bogota: BOGOTA_CITY_CONFIG,
  cdmx: CDMX_CITY_CONFIG,
  buenosaires: BUENOSAIRES_CITY_CONFIG,
};

export const SUPPORTED_CITIES_LIST: CityConfig[] = [
  CHICLAYO_CITY_CONFIG,
  LIMA_CITY_CONFIG,
  BOGOTA_CITY_CONFIG,
  CDMX_CITY_CONFIG,
  BUENOSAIRES_CITY_CONFIG,
];

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
