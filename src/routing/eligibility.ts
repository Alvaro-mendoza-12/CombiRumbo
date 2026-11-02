/**
 * Filtros de validez de segmentos.
 * Solo segmentos 'verified' y dentro de reviewAfter participan en búsqueda.
 */

import type { Catalog, Segment, Route } from '@/catalog/types';
import { getEffectiveStatus } from '@/catalog/catalog';

/** Un segmento es elegible si él y su ruta están 'verified' y reviewAfter no venció. */
export function isSegmentEligible(
  segment: Segment,
  route: Route | undefined,
  now: Date = new Date()
): boolean {
  if (!route) return false;
  if (route.status !== 'verified') return false;
  return getEffectiveStatus(segment, route, now) === 'verified';
}

/** Devuelve solo los segmentos elegibles del catálogo. */
export function getEligibleSegmentsForRouting(
  catalog: Catalog,
  now: Date = new Date()
): Segment[] {
  const routeMap = new Map(catalog.routes.map(r => [r.id, r]));
  return catalog.segments.filter(seg =>
    isSegmentEligible(seg, routeMap.get(seg.routeId), now)
  );
}
