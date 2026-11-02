/**
 * Validación del catálogo de recorridos verificados.
 * Rechaza registros sin procedencia, con coordenadas fuera de rango o estado inválido.
 */

import type {
  Catalog,
  CityConfig,
  Route,
  Segment,
  SegmentStatus,
  Source,
  Stop,
} from './types';
import { getCityConfig, DEFAULT_CITY_ID } from './config';
import { EMPTY_CATALOG } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const VALID_STATUSES: readonly SegmentStatus[] = [
  'verified',
  'aging',
  'unverified',
  'retired',
];

/** Valida que una coordenada esté dentro del rango de la ciudad correspondiente. */
export function isValidCoordinate(
  lat: number,
  lon: number,
  cityConfig: CityConfig = getCityConfig()
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= cityConfig.bounds.minLat &&
    lat <= cityConfig.bounds.maxLat &&
    lon >= cityConfig.bounds.minLon &&
    lon <= cityConfig.bounds.maxLon
  );
}

/** Valida que una fecha sea ISO 8601 parseable. */
export function isValidDate(dateStr: string | undefined | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function validateRoute(route: unknown, _sources: Source[]): route is Route {
  if (typeof route !== 'object' || route === null) return false;
  const r = route as Record<string, unknown>;
  return (
    typeof r.id === 'string' && r.id.length > 0 &&
    typeof r.cityId === 'string' && r.cityId.length > 0 &&
    typeof r.label === 'string' && r.label.length > 0 &&
    typeof r.status === 'string' && VALID_STATUSES.includes(r.status as SegmentStatus) &&
    typeof r.sourceId === 'string' && r.sourceId.length > 0 &&
    isValidDate(r.verifiedAt as string) &&
    isValidDate(r.reviewAfter as string)
  );
}

export function validateStop(
  stop: unknown,
  cityConfig: CityConfig = getCityConfig()
): stop is Stop {
  if (typeof stop !== 'object' || stop === null) return false;
  const s = stop as Record<string, unknown>;
  return (
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.cityId === 'string' && s.cityId.length > 0 &&
    typeof s.publicName === 'string' && s.publicName.length > 0 &&
    isValidCoordinate(s.lat as number, s.lon as number, cityConfig) &&
    typeof s.sourceId === 'string' && s.sourceId.length > 0 &&
    isValidDate(s.verifiedAt as string)
  );
}

export function validateSegment(segment: unknown): segment is Segment {
  if (typeof segment !== 'object' || segment === null) return false;
  const s = segment as Record<string, unknown>;
  // fare es opcional: si existe, debe ser número no negativo.
  if (s.fare !== undefined) {
    if (typeof s.fare !== 'number' || isNaN(s.fare) || s.fare < 0) return false;
  }
  return (
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.routeId === 'string' && s.routeId.length > 0 &&
    typeof s.fromStopId === 'string' && s.fromStopId.length > 0 &&
    typeof s.toStopId === 'string' && s.toStopId.length > 0 &&
    typeof s.sourceId === 'string' && s.sourceId.length > 0 &&
    typeof s.evidenceMethod === 'string' && s.evidenceMethod.length > 0 &&
    typeof s.status === 'string' && VALID_STATUSES.includes(s.status as SegmentStatus) &&
    isValidDate(s.observedAt as string)
  );
}

export function validateSource(source: unknown): source is Source {
  if (typeof source !== 'object' || source === null) return false;
  const s = source as Record<string, unknown>;
  return (
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.type === 'string' && s.type.length > 0 &&
    typeof s.title === 'string' && s.title.length > 0 &&
    isValidDate(s.observedAt as string)
  );
}

/**
 * Valida un catálogo completo.
 * Descarta registros inválidos y devuelve el catálogo filtrado + lista de errores.
 */
export function validateCatalog(raw: unknown): { catalog: Catalog; errors: string[] } {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { catalog: { ...EMPTY_CATALOG }, errors: ['Catálogo inválido: no es un objeto.'] };
  }

  const data = raw as Record<string, unknown>;
  const schemaVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 1;
  const cityId = typeof data.cityId === 'string' && data.cityId.length > 0
    ? data.cityId
    : DEFAULT_CITY_ID;
  const cityConfig = getCityConfig(cityId);
  const cityName = typeof data.cityName === 'string' && data.cityName.length > 0
    ? data.cityName
    : cityConfig.name;

  const lastUpdated = isValidDate(data.lastUpdated as string)
    ? (data.lastUpdated as string)
    : null;

  const rawSources = Array.isArray(data.sources) ? data.sources : [];
  const rawRoutes = Array.isArray(data.routes) ? data.routes : [];
  const rawStops = Array.isArray(data.stops) ? data.stops : [];
  const rawSegments = Array.isArray(data.segments) ? data.segments : [];

  const sources: Source[] = [];
  const validSourceIds = new Set<string>();

  for (const src of rawSources) {
    if (validateSource(src)) {
      sources.push(src);
      validSourceIds.add(src.id);
    } else {
      errors.push(`Fuente inválida descartada: ${JSON.stringify(src).slice(0, 80)}`);
    }
  }

  const routes: Route[] = [];
  for (const r of rawRoutes) {
    // Normalizar cityId si viene del catálogo
    const routeObj = (typeof r === 'object' && r !== null && !('cityId' in r))
      ? { ...(r as Record<string, unknown>), cityId }
      : r;

    if (validateRoute(routeObj, sources)) {
      // Verifica que el sourceId exista.
      if (validSourceIds.has((routeObj as Route).sourceId)) {
        routes.push(routeObj as Route);
      } else {
        errors.push(`Ruta "${(routeObj as Route).id}" descartada: sourceId no existe.`);
      }
    } else {
      errors.push(`Ruta inválida descartada: ${JSON.stringify(r).slice(0, 80)}`);
    }
  }

  const stops: Stop[] = [];
  for (const s of rawStops) {
    const stopObj = (typeof s === 'object' && s !== null && !('cityId' in s))
      ? { ...(s as Record<string, unknown>), cityId }
      : s;

    if (validateStop(stopObj, cityConfig)) {
      if (validSourceIds.has((stopObj as Stop).sourceId)) {
        stops.push(stopObj as Stop);
      } else {
        errors.push(`Paradero "${(stopObj as Stop).id}" descartado: sourceId no existe.`);
      }
    } else {
      errors.push(`Paradero inválido descartado: ${JSON.stringify(s).slice(0, 80)}`);
    }
  }

  const validStopIds = new Set(stops.map(s => s.id));
  const validRouteIds = new Set(routes.map(r => r.id));

  const segments: Segment[] = [];
  for (const seg of rawSegments) {
    if (validateSegment(seg)) {
      const s = seg as Segment;
      if (
        validSourceIds.has(s.sourceId) &&
        validStopIds.has(s.fromStopId) &&
        validStopIds.has(s.toStopId) &&
        validRouteIds.has(s.routeId)
      ) {
        segments.push(s);
      } else {
        errors.push(`Segmento "${s.id}" descartado: referencia inválida (route/stop/source).`);
      }
    } else {
      errors.push(`Segmento inválido descartado: ${JSON.stringify(seg).slice(0, 80)}`);
    }
  }

  return {
    catalog: { schemaVersion, cityId, cityName, lastUpdated, routes, stops, segments, sources },
    errors,
  };
}
