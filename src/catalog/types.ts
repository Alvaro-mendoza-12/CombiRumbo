/**
 * Modelo de datos del catálogo de recorridos verificados.
 * Basado en 06-arquitectura/arquitectura.md y PROMPT_MAESTRO_KIRO.md.
 * Cada recorrido y paradero se asocia a una ciudad identificada (cityId).
 * Ningún campo opcional se rellena por inferencia.
 */

export type SegmentStatus = 'verified' | 'aging' | 'unverified' | 'retired';

export type SourceType =
  | 'field-observation'
  | 'document'
  | 'community-report'
  | 'osm';

export type ReportKind =
  | 'unit-passed'
  | 'unit-absent'
  | 'stop-changed'
  | 'other';

export type LandmarkCategory =
  | 'center'
  | 'university'
  | 'market'
  | 'health'
  | 'beach'
  | 'transit-hub'
  | 'general';

/** Configuración de una ciudad soportada o piloto. */
export interface CityConfig {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  boundingCenter: [number, number];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  defaultZoom: number;
  pilotStatus: 'active-pilot' | 'planned' | 'unsupported';
  coverageSummary: string;
  transportModes: string[];
}

/** Punto de interés geográfico o destino buscable (universidades, hospitales, etc.). */
export interface Place {
  id: string;
  cityId: string;
  name: string;
  shortName?: string;
  category: LandmarkCategory;
  address?: string;
  landmarkContext?: string;
  lat: number;
  lon: number;
  aliases: string[];
  isVerifiedTransitStop?: boolean;
  transitStopId?: string;
}

/** Ruta/línea de transporte verificada en campo. */
export interface Route {
  id: string;
  /** Identificador de ciudad a la que pertenece la ruta. */
  cityId: string;
  /** Etiqueta que los pasajeros usan para identificar la unidad. */
  label: string;
  direction?: string;
  operatorName?: string;
  /** Tipo de vehículo observado (ej. 'combi', 'microbus'). */
  vehicleType?: string;
  /** Letrero visible en parabrisas para reconocer la unidad. */
  vehicleSign?: string;
  /** Color/diseño exterior característico de la unidad. */
  vehicleColor?: string;
  /** Color distintivo en interfaz para graficar la ruta. */
  routeColor?: string;
  status: SegmentStatus;
  sourceId: string;
  /** Fecha de verificación en ISO 8601. */
  verifiedAt: string;
  /** Fecha límite de revisión; tras ella el segmento pasa a 'aging'. */
  reviewAfter: string;
}

/** Paradero o punto de referencia público. */
export interface Stop {
  id: string;
  /** Identificador de ciudad a la que pertenece el paradero. */
  cityId: string;
  publicName: string;
  /** Contexto físico para ubicar el paradero (ej. 'frente al banco', 'esquina noroeste'). */
  landmarkContext?: string;
  /** Categoría temática para agrupar y facilitar selección. */
  category?: LandmarkCategory;
  lat: number;
  lon: number;
  sourceId: string;
  verifiedAt: string;
}

/** Tramo entre dos paraderos sobre una ruta verificada. */
export interface Segment {
  id: string;
  routeId: string;
  fromStopId: string;
  toStopId: string;
  /** Secuencia de puntos [lat, lon] del recorrido observado (sigue las calles). */
  geometry?: [number, number][];
  boardingNote?: string;
  /** Indicación para abordar la unidad o hacer señal al conductor. */
  boardingCue?: string;
  alightingNote?: string;
  /** Indicación para avisar la bajada al conductor/cobrador. */
  alightingCue?: string;
  /** Tiempo estimado a bordo en minutos según tráfico promedio observado. */
  estimatedMinutes?: number;
  /** Solo si fue observada y confirmada en campo. */
  fare?: number;
  fareUnit?: string;
  sourceId: string;
  evidenceMethod: string;
  status: SegmentStatus;
  observedAt: string;
}

/** Procedencia y trazabilidad de un dato del catálogo. */
export interface Source {
  id: string;
  type: SourceType;
  title: string;
  observerId?: string;
  url?: string;
  license?: string;
  observedAt: string;
  notes?: string;
}

/** Reporte temporal de un pasajero. Nunca modifica el catálogo verificado. */
export interface LiveReport {
  id: string;
  routeId: string;
  stopId?: string;
  kind: ReportKind;
  /** ISO 8601 del instante de creación. */
  createdAt: string;
  /** ISO 8601 del instante de caducidad. */
  expiresAt: string;
  /** Conteo agregado por bucket; sin identificadores personales. */
  countBucket: number;
}

/** Catálogo completo cargado desde JSON. */
export interface Catalog {
  schemaVersion: number;
  cityId: string;
  cityName: string;
  lastUpdated: string | null;
  routes: Route[];
  stops: Stop[];
  segments: Segment[];
  sources: Source[];
}

/** Catálogo vacío intencional para Chiclayo. Es un estado válido del producto. */
export const EMPTY_CATALOG: Catalog = {
  schemaVersion: 1,
  cityId: 'chiclayo',
  cityName: 'Chiclayo',
  lastUpdated: null,
  routes: [],
  stops: [],
  segments: [],
  sources: [],
};
