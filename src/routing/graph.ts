/**
 * Grafo de paraderos y segmentos.
 * Nodos: stops. Aristas: segments elegibles.
 */

import type { Catalog, Segment, Stop } from '@/catalog/types';
import { getEligibleSegmentsForRouting } from './eligibility';

export interface GraphEdge {
  segmentId: string;
  routeId: string;
  fromStopId: string;
  toStopId: string;
  /** Distancia de caminata estimada entre paraderos de conexión. */
  walkMeters: number;
}

export interface Graph {
  /** stopId → lista de aristas salientes. */
  adjacency: Map<string, GraphEdge[]>;
  stopMap: Map<string, Stop>;
  segments: Segment[];
}

/** Construye el grafo a partir del catálogo usando solo segmentos elegibles. */
export function buildGraph(catalog: Catalog, now: Date = new Date()): Graph {
  const eligible = getEligibleSegmentsForRouting(catalog, now);
  const adjacency = new Map<string, GraphEdge[]>();
  const stopMap = new Map<string, Stop>();

  for (const stop of catalog.stops) {
    stopMap.set(stop.id, stop);
  }

  for (const seg of eligible) {
    const fromStop = stopMap.get(seg.fromStopId);
    const toStop = stopMap.get(seg.toStopId);
    if (!fromStop || !toStop) continue;

    const walkMeters = 0; // caminata dentro del transporte = 0
    const edge: GraphEdge = {
      segmentId: seg.id,
      routeId: seg.routeId,
      fromStopId: seg.fromStopId,
      toStopId: seg.toStopId,
      walkMeters,
    };

    if (!adjacency.has(seg.fromStopId)) adjacency.set(seg.fromStopId, []);
    adjacency.get(seg.fromStopId)!.push(edge);
  }

  return { adjacency, stopMap, segments: eligible };
}

/**
 * Encuentra el paradero del catálogo más cercano a una coordenada.
 */
export function findNearestStop(
  graph: Graph,
  lat: number,
  lon: number
): Stop | undefined {
  let nearest: Stop | undefined;
  let minDist = Infinity;

  for (const stop of graph.stopMap.values()) {
    const dx = stop.lat - lat;
    const dy = stop.lon - lon;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = stop;
    }
  }

  return nearest;
}

/** Distancia haversine en metros. */
export function haversineMeters(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
