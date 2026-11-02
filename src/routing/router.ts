/**
 * Router: cálculo de itinerarios entre origen y destino.
 * Prioriza menos transbordos, luego menos caminata estimada.
 * No afirma tiempos de viaje; solo transbordos y caminata.
 */

import type { Catalog } from '@/catalog/types';
import { buildGraph, haversineMeters, type Graph, type GraphEdge } from './graph';
import type { Itinerary } from './format';

const MAX_TRANSFERS = 3;
const MAX_RESULTS = 5;
const WALK_SPEED_M_PER_S = 1.25; // ~4.5 km/h

interface PathNode {
  stopId: string;
  edge?: GraphEdge;
  routeId?: string;
  transfers: number;
  walkMeters: number;
  path: GraphEdge[];
  visitedRoutes: Set<string>;
  visitedStops: Set<string>;
}

/**
 * Busca itinerarios del origen al destino usando BFS por niveles (menos transbordos primero).
 */
export function findItineraries(
  catalog: Catalog,
  originStopId: string,
  destinationStopId: string,
  now: Date = new Date()
): Itinerary[] {
  if (originStopId === destinationStopId) return [];

  const graph = buildGraph(catalog, now);

  // Si el origen o destino no están en el grafo, no hay ruta.
  if (!graph.stopMap.has(originStopId) || !graph.stopMap.has(destinationStopId)) {
    return [];
  }

  // BFS por niveles de transbordos
  const results: PathNode[] = [];
  const queue: PathNode[] = [];

  // Estado inicial
  queue.push({
    stopId: originStopId,
    transfers: 0,
    walkMeters: 0,
    path: [],
    visitedRoutes: new Set(),
    visitedStops: new Set([originStopId]),
  });

  let found = false;

  while (queue.length > 0 && results.length < MAX_RESULTS) {
    const current = queue.shift()!;

    if (current.stopId === destinationStopId) {
      if (current.path.length > 0) {
        results.push(current);
        found = true;
      }
      continue;
    }

    // Prune: si ya hay resultados, no seguir expandiendo más allá de los transbordos del mejor
    if (found && current.transfers >= results[0]!.transfers + MAX_TRANSFERS) {
      continue;
    }

    if (current.transfers > MAX_TRANSFERS) continue;

    const edges = graph.adjacency.get(current.stopId) ?? [];
    for (const edge of edges) {
      if (current.visitedStops.has(edge.toStopId)) continue;

      const isNewRoute = edge.routeId !== current.routeId;
      const newTransfers = isNewRoute && current.routeId !== undefined
        ? current.transfers + 1
        : current.transfers;

      if (newTransfers > MAX_TRANSFERS) continue;

      // Calcular caminata de conexión si hay cambio de ruta en un paradero intermedio
      let extraWalk = 0;
      if (isNewRoute && current.routeId !== undefined && edge.fromStopId !== current.stopId) {
        const fromStop = graph.stopMap.get(current.stopId);
        const toStop = graph.stopMap.get(edge.fromStopId);
        if (fromStop && toStop) {
          extraWalk = haversineMeters(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
        }
      }

      const newVisitedRoutes = new Set(current.visitedRoutes);
      newVisitedRoutes.add(edge.routeId);
      const newVisitedStops = new Set(current.visitedStops);
      newVisitedStops.add(edge.toStopId);

      queue.push({
        stopId: edge.toStopId,
        edge,
        routeId: edge.routeId,
        transfers: newTransfers,
        walkMeters: current.walkMeters + extraWalk,
        path: [...current.path, edge],
        visitedRoutes: newVisitedRoutes,
        visitedStops: newVisitedStops,
      });
    }
  }

  // Convertir a Itinerary
  const itineraries: Itinerary[] = [];
  const seenSignatures = new Set<string>();

  for (const result of results) {
    const itinerary = pathToItinerary(catalog, graph, result);
    if (!itinerary) continue;
    const sig = itinerary.steps.map(s => s.segment?.id ?? s.label).join('|');
    if (seenSignatures.has(sig)) continue;
    seenSignatures.add(sig);
    itineraries.push(itinerary);
  }

  // Ordenar: menos transbordos, luego menos caminata
  itineraries.sort((a, b) => {
    if (a.totalTransfers !== b.totalTransfers) return a.totalTransfers - b.totalTransfers;
    return a.estimatedWalkMeters - b.estimatedWalkMeters;
  });

  return itineraries.slice(0, MAX_RESULTS);
}

function pathToItinerary(
  catalog: Catalog,
  graph: Graph,
  result: PathNode
): Itinerary | null {
  const steps: Itinerary['steps'] = [];
  let totalFare: number | null = 0;
  let fareConfirmed = true;
  let minObservedAt = new Date(8640000000000000).toISOString();
  let walkTotal = result.walkMeters;

  for (let i = 0; i < result.path.length; i++) {
    const edge = result.path[i]!;
    const segment = catalog.segments.find(s => s.id === edge.segmentId);
    if (!segment) continue;

    const route = catalog.routes.find(r => r.id === segment.routeId);
    if (!route) continue;

    const fromStop = graph.stopMap.get(edge.fromStopId);
    const toStop = graph.stopMap.get(edge.toStopId);
    if (!fromStop || !toStop) continue;

    const source = catalog.sources.find(s => s.id === segment.sourceId);

    steps.push({
      type: 'ride',
      label: route.label,
      fromStop,
      toStop,
      route,
      segment,
      boardingNote: segment.boardingNote,
      alightingNote: segment.alightingNote,
      fare: segment.fare !== undefined
        ? { amount: segment.fare, unit: segment.fareUnit ?? 'S/' }
        : undefined,
      source,
      observedAt: segment.observedAt,
      status: 'verified',
    });

    // Contabilizar tarifa por cada abordaje de ruta (no por cada paradero intermedio)
    const isFirstSegmentOfRide = i === 0 || result.path[i - 1]!.routeId !== route.id;
    if (isFirstSegmentOfRide) {
      if (segment.fare === undefined) {
        fareConfirmed = false;
      } else {
        totalFare = (totalFare ?? 0) + segment.fare;
      }
    } else if (segment.fare === undefined) {
      fareConfirmed = false;
    }

    if (segment.observedAt < minObservedAt) {
      minObservedAt = segment.observedAt;
    }

    // Caminata de transbordo entre segmentos consecutivos de distinta ruta
    if (i < result.path.length - 1) {
      const nextEdge = result.path[i + 1]!;
      const nextSegment = catalog.segments.find(s => s.id === nextEdge.segmentId);
      const nextRoute = nextSegment ? catalog.routes.find(r => r.id === nextSegment.routeId) : undefined;
      if (nextRoute && nextRoute.id !== route.id && edge.toStopId !== nextEdge.fromStopId) {
        const fromTransbordo = graph.stopMap.get(edge.toStopId);
        const toTransbordo = graph.stopMap.get(nextEdge.fromStopId);
        if (fromTransbordo && toTransbordo) {
          const walkDist = haversineMeters(
            fromTransbordo.lat, fromTransbordo.lon,
            toTransbordo.lat, toTransbordo.lon
          );
          walkTotal += walkDist;
          steps.push({
            type: 'walk',
            label: 'Transbordo',
            fromStop: fromTransbordo,
            toStop: toTransbordo,
            walkMeters: walkDist,
            status: 'verified',
          });
        }
      }
    }
  }

  if (steps.length === 0) return null;

  return {
    id: `itin-${Math.random().toString(36).slice(2, 9)}`,
    steps,
    totalTransfers: result.transfers,
    estimatedWalkMeters: walkTotal,
    estimatedWalkSeconds: Math.round(walkTotal / WALK_SPEED_M_PER_S),
    orderingCriteria: 'Menos transbordos',
    verificationDate: minObservedAt,
    fare: {
      amount: fareConfirmed ? totalFare : null,
      unit: 'S/',
      confirmed: fareConfirmed,
    },
  };
}
