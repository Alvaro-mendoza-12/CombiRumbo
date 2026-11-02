/**
 * Carga y consulta del catálogo de recorridos verificados.
 */

import type { Catalog, Route, Segment, Source, Stop, SegmentStatus, CityConfig } from './types';
import { EMPTY_CATALOG } from './types';
import { validateCatalog } from './validator';
import { isReviewExpired, getCityConfig } from './config';

/** Carga el catálogo desde JSON crudo (puede venir del fetch o del cache local). */
export function loadCatalog(rawJson: unknown): { catalog: Catalog; errors: string[] } {
  if (!rawJson || (typeof rawJson === 'object' && rawJson !== null && Object.keys(rawJson as object).length === 0)) {
    return { catalog: { ...EMPTY_CATALOG }, errors: [] };
  }
  const { catalog, errors } = validateCatalog(rawJson);
  return { catalog, errors };
}

/** Devuelve la configuración de la ciudad asociada al catálogo. */
export function getCatalogCity(catalog: Catalog): CityConfig {
  return getCityConfig(catalog.cityId);
}

/** True si el catálogo no tiene rutas ni segmentos. */
export function isCatalogEmpty(catalog: Catalog): boolean {
  return catalog.routes.length === 0 && catalog.segments.length === 0;
}

/**
 * Determina el estado efectivo de un segmento considerando la fecha de revisión.
 * Un segmento 'verified' con reviewAfter vencido se recategoriza a 'aging'.
 */
export function getEffectiveStatus(segment: Segment, route: Route | undefined, now: Date = new Date()): SegmentStatus {
  if (segment.status === 'verified' && route) {
    if (isReviewExpired(route.reviewAfter, now)) {
      return 'aging';
    }
  }
  return segment.status;
}

/**
 * Segmentos elegibles para búsqueda: status 'verified' y reviewAfter vigente.
 */
export function getEligibleSegments(catalog: Catalog, now: Date = new Date()): Segment[] {
  const routeMap = new Map(catalog.routes.map(r => [r.id, r]));
  return catalog.segments.filter(seg => {
    const route = routeMap.get(seg.routeId);
    if (!route) return false;
    return getEffectiveStatus(seg, route, now) === 'verified' &&
           route.status === 'verified';
  });
}

/**
 * Segmentos en estado 'aging' (verificación antigua, requiere aviso).
 */
export function getAgingSegments(catalog: Catalog, now: Date = new Date()): Segment[] {
  const routeMap = new Map(catalog.routes.map(r => [r.id, r]));
  return catalog.segments.filter(seg => {
    const route = routeMap.get(seg.routeId);
    if (!route) return false;
    return getEffectiveStatus(seg, route, now) === 'aging';
  });
}

/** Busca una fuente por id. */
export function getSource(catalog: Catalog, sourceId: string): Source | undefined {
  return catalog.sources.find(s => s.id === sourceId);
}

/** Busca una ruta por id. */
export function getRoute(catalog: Catalog, routeId: string): Route | undefined {
  return catalog.routes.find(r => r.id === routeId);
}

/** Busca un paradero por id. */
export function getStop(catalog: Catalog, stopId: string): Stop | undefined {
  return catalog.stops.find(s => s.id === stopId);
}

/** Obtiene los paraderos from y to de un segmento. */
export function getStopsForSegment(
  catalog: Catalog,
  segment: Segment
): { from: Stop | undefined; to: Stop | undefined } {
  return {
    from: getStop(catalog, segment.fromStopId),
    to: getStop(catalog, segment.toStopId),
  };
}

/** Lista los nombres de paraderos únicos del catálogo (para autocompletar). */
export function getStopNames(catalog: Catalog): { id: string; name: string }[] {
  return catalog.stops.map(s => ({ id: s.id, name: s.publicName }));
}
