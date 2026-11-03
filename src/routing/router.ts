/**
 * Router: cálculo de itinerarios entre origen y destino.
 * Prioriza menos transbordos, luego menos caminata estimada.
 * Calcula tiempos de viaje realistas, instrucciones de abordaje/descenso
 * y alternativas de caminata directa cuando los puntos están muy próximos.
 */

import type { Catalog } from '@/catalog/types';
import { buildGraph, haversineMeters, type Graph, type GraphEdge } from './graph';
import type { Itinerary, ItineraryStep } from './format';

const MAX_TRANSFERS = 2;
const MAX_RESULTS = 4;
const WALK_SPEED_M_PER_S = 1.25; // ~4.5 km/h peatonal
const TRANSIT_AVG_SPEED_KM_H = 22; // ~366 m/min velocidad promedio combi urbana/interurbana
const DWELL_TIME_MINUTES = 0.75; // tiempo promedio de parada para subida/bajada

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
  now: Date = new Date(),
  customOriginCoords?: { lat: number; lon: number }
): Itinerary[] {
  if (originStopId === destinationStopId) return [];

  const graph = buildGraph(catalog, now);

  const originStop = graph.stopMap.get(originStopId);
  const destStop = graph.stopMap.get(destinationStopId);

  // Si el origen o destino no están en el grafo, no hay ruta.
  if (!originStop || !destStop) {
    return [];
  }

  // 1. Caso de proximidad peatonal: si origen y destino están a menos de 280m
  const proximityWalkMeters = haversineMeters(originStop.lat, originStop.lon, destStop.lat, destStop.lon);
  const isWalkingOnlyCandidate = proximityWalkMeters <= 280;

  // BFS por niveles de transbordos
  const results: PathNode[] = [];
  const queue: PathNode[] = [];

  queue.push({
    stopId: originStopId,
    transfers: 0,
    walkMeters: 0,
    path: [],
    visitedRoutes: new Set(),
    visitedStops: new Set([originStopId]),
  });

  let found = false;

  while (queue.length > 0 && results.length < MAX_RESULTS * 2) {
    const current = queue.shift()!;

    if (current.stopId === destinationStopId) {
      if (current.path.length > 0) {
        results.push(current);
        found = true;
      }
      continue;
    }

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

  // Convertir caminos a Itinerarios formateados
  const itineraries: Itinerary[] = [];
  const seenSignatures = new Set<string>();

  for (const result of results) {
    const itinerary = pathToItinerary(catalog, graph, result, customOriginCoords);
    if (!itinerary) continue;
    const sig = itinerary.steps.map(s => s.segment?.id ?? s.label).join('|');
    if (seenSignatures.has(sig)) continue;
    seenSignatures.add(sig);
    itineraries.push(itinerary);
  }

  // Ordenar alternativas: menos transbordos, luego menos caminata, luego menos duración
  itineraries.sort((a, b) => {
    if (a.totalTransfers !== b.totalTransfers) return a.totalTransfers - b.totalTransfers;
    if (a.estimatedWalkMeters !== b.estimatedWalkMeters) return a.estimatedWalkMeters - b.estimatedWalkMeters;
    return a.estimatedTotalMinutes - b.estimatedTotalMinutes;
  });

  // Si ambos puntos están muy cerca (< 280 m), agregar la opción de caminata directa
  if (isWalkingOnlyCandidate) {
    const walkSeconds = Math.round(proximityWalkMeters / WALK_SPEED_M_PER_S);
    const walkMins = Math.max(1, Math.ceil(walkSeconds / 60));
    const directWalkItin: Itinerary = {
      id: `itin-walk-${originStop.id}-${destStop.id}`,
      steps: [
        {
          type: 'direct-walk',
          label: `Caminata directa hacia ${destStop.publicName}`,
          fromStop: originStop,
          toStop: destStop,
          walkMeters: proximityWalkMeters,
          durationMinutes: walkMins,
          status: 'verified',
          boardingTip: 'Ambos puntos están a muy corta distancia; no requieres tomar transporte.',
          alightingTip: `Llegarás a pie en aproximadamente ${walkMins} min.`,
          geometry: [
            [originStop.lat, originStop.lon],
            [destStop.lat, destStop.lon],
          ],
        },
      ],
      totalTransfers: 0,
      estimatedWalkMeters: proximityWalkMeters,
      estimatedWalkSeconds: walkSeconds,
      estimatedRideMinutes: 0,
      estimatedTotalMinutes: walkMins,
      tag: 'walking-only',
      tags: ['walking-only'],
      totalWalkMinutes: walkMins,
      totalWalkMeters: proximityWalkMeters,
      tagLabel: '🚶 Paseo a pie recomendado',
      summary: `Caminar directo (${proximityWalkMeters} m)`,
      orderingCriteria: 'Distancia peatonal corta',
      verificationDate: originStop.verifiedAt,
      fare: {
        amount: 0,
        unit: 'S/',
        confirmed: true,
      },
    };
    itineraries.unshift(directWalkItin);
  }

  // Asignar etiquetas y jerarquía visual a las alternativas
  const finalResults = itineraries.slice(0, MAX_RESULTS);
  for (let idx = 0; idx < finalResults.length; idx++) {
    const item = finalResults[idx]!;
    if (item.tag === 'walking-only') continue;

    if (idx === 0) {
      item.tag = 'recommended';
      item.tags = ['recommended', item.totalTransfers === 0 ? 'direct' : 'transfer'];
      item.tagLabel = item.totalTransfers === 0
        ? '⭐ Recomendada (Directa)'
        : '⭐ Recomendada';
    } else if (item.totalTransfers === 0) {
      item.tag = 'direct';
      item.tags = ['direct'];
      item.tagLabel = 'Directa';
    } else {
      item.tag = 'least-walking';
      item.tags = ['transfer'];
      item.tagLabel = `${item.totalTransfers} transbordo${item.totalTransfers > 1 ? 's' : ''}`;
    }
  }

  return finalResults;
}

function pathToItinerary(
  catalog: Catalog,
  graph: Graph,
  result: PathNode,
  customOriginCoords?: { lat: number; lon: number }
): Itinerary | null {
  const steps: ItineraryStep[] = [];
  let totalFare: number | null = 0;
  let fareConfirmed = true;
  let minObservedAt = new Date(8640000000000000).toISOString();
  let walkTotal = result.walkMeters;
  let totalRideMinutes = 0;

  const firstEdge = result.path[0];
  if (!firstEdge) return null;
  const firstBoardingStop = graph.stopMap.get(firstEdge.fromStopId);

  // Si el usuario proporcionó coordenadas GPS de origen, incluir caminata inicial
  if (customOriginCoords && firstBoardingStop) {
    const gpsWalkDist = haversineMeters(
      customOriginCoords.lat,
      customOriginCoords.lon,
      firstBoardingStop.lat,
      firstBoardingStop.lon
    );
    if (gpsWalkDist > 25) {
      walkTotal += gpsWalkDist;
      const initialWalkMins = Math.max(1, Math.round(gpsWalkDist / WALK_SPEED_M_PER_S / 60));
      steps.push({
        type: 'walk',
        label: `Camina al paradero inicial (${firstBoardingStop.publicName})`,
        fromStop: undefined,
        toStop: firstBoardingStop,
        walkMeters: gpsWalkDist,
        durationMinutes: initialWalkMins,
        boardingTip: firstBoardingStop.landmarkContext
          ? `Dirígete a: ${firstBoardingStop.landmarkContext}`
          : `Camina hacia el paradero ${firstBoardingStop.publicName}`,
        status: 'verified',
        geometry: [
          [customOriginCoords.lat, customOriginCoords.lon],
          [firstBoardingStop.lat, firstBoardingStop.lon],
        ],
      });
    }
  }

  const distinctRouteLabels: string[] = [];

  for (let i = 0; i < result.path.length; i++) {
    const edge = result.path[i]!;
    const segment = catalog.segments.find(s => s.id === edge.segmentId);
    if (!segment) continue;

    const route = catalog.routes.find(r => r.id === segment.routeId);
    if (!route) continue;

    if (!distinctRouteLabels.includes(route.label)) {
      distinctRouteLabels.push(route.label);
    }

    const fromStop = graph.stopMap.get(edge.fromStopId);
    const toStop = graph.stopMap.get(edge.toStopId);
    if (!fromStop || !toStop) continue;

    const source = catalog.sources.find(s => s.id === segment.sourceId);

    // Estimación de tiempo del tramo
    const segDist = haversineMeters(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    const estMin = segment.estimatedMinutes ?? Math.max(2, Math.round((segDist / (TRANSIT_AVG_SPEED_KM_H * 1000 / 60)) + DWELL_TIME_MINUTES));
    totalRideMinutes += estMin;

    steps.push({
      type: 'ride',
      label: route.label,
      fromStop,
      toStop,
      route,
      segment,
      boardingNote: segment.boardingNote,
      boardingTip: fromStop.landmarkContext
        ? `Aborda en: ${fromStop.landmarkContext}`
        : `Haz la señal con la mano en el paradero ${fromStop.publicName}`,
      vehicleSign: route.vehicleSign,
      vehicleDescription: route.vehicleColor,
      alightingNote: segment.alightingNote,
      alightingTip: segment.alightingCue || `Avisa con anticipación: 'Baja en ${toStop.publicName}'`,
      fare: segment.fare !== undefined
        ? { amount: segment.fare, unit: segment.fareUnit ?? 'S/' }
        : undefined,
      durationMinutes: estMin,
      source,
      observedAt: segment.observedAt,
      status: 'verified',
      geometry: segment.geometry ?? [
        [fromStop.lat, fromStop.lon],
        [toStop.lat, toStop.lon],
      ],
    });

    // Contabilizar tarifa por cada abordaje de ruta diferente (no por cada paradero intermedio del mismo vehículo)
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

    // Caminata de transbordo entre segmentos de diferente ruta
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
          const transferWalkMins = Math.max(1, Math.round(walkDist / WALK_SPEED_M_PER_S / 60));
          steps.push({
            type: 'transfer',
            label: `Transbordo a pie hacia ${toTransbordo.publicName}`,
            fromStop: fromTransbordo,
            toStop: toTransbordo,
            walkMeters: walkDist,
            durationMinutes: transferWalkMins,
            boardingTip: `Camina ${walkDist} m (aprox. ${transferWalkMins} min) hacia ${toTransbordo.publicName} para tomar ${nextRoute.label}.`,
            status: 'verified',
            geometry: [
              [fromTransbordo.lat, fromTransbordo.lon],
              [toTransbordo.lat, toTransbordo.lon],
            ],
          });
        }
      }
    }
  }

  if (steps.length === 0) return null;

  const totalWalkSeconds = Math.round(walkTotal / WALK_SPEED_M_PER_S);
  const totalWalkMinutes = Math.round(totalWalkSeconds / 60);
  const estimatedTotalMinutes = Math.max(1, totalWalkMinutes + totalRideMinutes);

  return {
    id: `itin-${Math.random().toString(36).slice(2, 9)}`,
    steps,
    totalTransfers: result.transfers,
    estimatedWalkMeters: walkTotal,
    estimatedWalkSeconds: totalWalkSeconds,
    estimatedRideMinutes: totalRideMinutes,
    estimatedTotalMinutes,
    tag: result.transfers === 0 ? 'direct' : 'least-walking',
    tags: result.transfers === 0 ? ['direct'] : ['transfer'],
    totalWalkMinutes,
    totalWalkMeters: walkTotal,
    tagLabel: result.transfers === 0 ? 'Directa' : `${result.transfers} transbordo(s)`,
    summary: distinctRouteLabels.join(' ➔ ') || 'Recorrido verificado',
    orderingCriteria: 'Menos transbordos y caminata',
    verificationDate: minObservedAt,
    fare: {
      amount: fareConfirmed ? totalFare : null,
      unit: 'S/',
      confirmed: fareConfirmed,
    },
  };
}
