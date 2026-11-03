/**
 * Estado de búsqueda y resultados.
 * Maneja selección mutuamente excluyente de paraderos, geolocalización local,
 * intercambio rápido (swap), validación de proximidad y cálculo de alternativas.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Catalog, Stop, LandmarkCategory } from '@/catalog/types';
import type { Itinerary } from '@/routing/format';
import { findItineraries } from '@/routing/router';
import { isCatalogEmpty } from '@/catalog/catalog';
import { buildGraph } from '@/routing/graph';
import { haversineMeters } from '@/accessibility/a11y';

export type SearchState =
  | 'idle'
  | 'searching'
  | 'results'
  | 'no-results'
  | 'same-location'
  | 'empty-catalog';

export interface UserCoords {
  lat: number;
  lon: number;
  nearestStopId?: string;
  distanceToNearest?: number;
}

export function useSearch(catalog: Catalog) {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originStopId, setOriginStopId] = useState<string | null>(null);
  const [destinationStopId, setDestinationStopId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [isUsingGpsOrigin, setIsUsingGpsOrigin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LandmarkCategory | 'all'>('all');
  const [state, setState] = useState<SearchState>('idle');
  const [results, setResults] = useState<Itinerary[]>([]);

  const graph = useMemo(() => buildGraph(catalog), [catalog]);

  // Paraderos ordenados alfabéticamente
  const allStops = useMemo(() => {
    return [...catalog.stops].sort((a, b) => a.publicName.localeCompare(b.publicName));
  }, [catalog.stops]);

  // Lista de orígenes disponibles: excluye el paradero seleccionado como destino
  const availableOrigins = useMemo(() => {
    return allStops.filter(s => s.id !== destinationStopId);
  }, [allStops, destinationStopId]);

  // Lista de destinos disponibles: excluye el paradero seleccionado como origen
  const availableDestinations = useMemo(() => {
    return allStops.filter(s => s.id !== originStopId);
  }, [allStops, originStopId]);

  // Función de selección segura de origen
  const selectOrigin = useCallback((stop: Stop | null) => {
    if (!stop) {
      setOriginStopId(null);
      setOriginQuery('');
      setIsUsingGpsOrigin(false);
      return;
    }
    setOriginStopId(stop.id);
    setOriginQuery(stop.publicName);
    setIsUsingGpsOrigin(false);
    // Si el destino era igual al nuevo origen, limpiarlo
    if (destinationStopId === stop.id) {
      setDestinationStopId(null);
      setDestinationQuery('');
    }
    setState('idle');
  }, [destinationStopId]);

  // Función de selección segura de destino
  const selectDestination = useCallback((stop: Stop | null) => {
    if (!stop) {
      setDestinationStopId(null);
      setDestinationQuery('');
      return;
    }
    setDestinationStopId(stop.id);
    setDestinationQuery(stop.publicName);
    // Si el origen era igual al nuevo destino, limpiarlo
    if (originStopId === stop.id) {
      setOriginStopId(null);
      setOriginQuery('');
      setIsUsingGpsOrigin(false);
    }
    setState('idle');
  }, [originStopId]);

  // Intercambiar origen y destino (swap ⇄)
  const swapStops = useCallback(() => {
    const prevOriginId = originStopId;
    const prevOriginName = originQuery;
    const prevDestId = destinationStopId;
    const prevDestName = destinationQuery;

    setOriginStopId(prevDestId);
    setOriginQuery(prevDestName);
    setDestinationStopId(prevOriginId);
    setDestinationQuery(prevOriginName);
    setIsUsingGpsOrigin(false);

    if (prevDestId && prevOriginId) {
      // Re-ejecutar búsqueda en sentido inverso
      if (isCatalogEmpty(catalog)) {
        setState('empty-catalog');
        return;
      }
      setState('searching');
      const itineraries = findItineraries(catalog, prevDestId, prevOriginId);
      if (itineraries.length === 0) {
        setState('no-results');
        setResults([]);
      } else {
        setState('results');
        setResults(itineraries);
      }
    } else {
      setState('idle');
    }
  }, [originStopId, originQuery, destinationStopId, destinationQuery, catalog]);

  // Ejecutar búsqueda con validación
  const search = useCallback(
    (fromId: string, toId: string) => {
      if (isCatalogEmpty(catalog)) {
        setState('empty-catalog');
        setResults([]);
        return;
      }

      if (fromId === toId) {
        setState('same-location');
        setResults([]);
        return;
      }

      setState('searching');
      const coords = isUsingGpsOrigin && userCoords
        ? { lat: userCoords.lat, lon: userCoords.lon }
        : undefined;

      const itineraries = findItineraries(catalog, fromId, toId, new Date(), coords);

      if (itineraries.length === 0) {
        setState('no-results');
        setResults([]);
      } else {
        setState('results');
        setResults(itineraries);
      }
    },
    [catalog, isUsingGpsOrigin, userCoords]
  );

  const reset = useCallback(() => {
    setState('idle');
    setResults([]);
  }, []);

  const setCustomOriginLocation = useCallback((coords: { lat: number; lon: number }, nearestStopId: string | null) => {
    setUserCoords(coords);
    setIsUsingGpsOrigin(true);
    if (nearestStopId) {
      const stop = catalog.stops.find(s => s.id === nearestStopId);
      if (stop) {
        setOriginStopId(stop.id);
        setOriginQuery(stop.publicName);
        if (destinationStopId === stop.id) {
          setDestinationStopId(null);
          setDestinationQuery('');
        }
      }
    }
  }, [catalog.stops, destinationStopId]);

  const clearCustomOrigin = useCallback(() => {
    setIsUsingGpsOrigin(false);
    setUserCoords(null);
  }, []);

  const nearInfo = useMemo(() => {
    if (!isUsingGpsOrigin || !userCoords || !originStopId) return null;
    const stop = catalog.stops.find(s => s.id === originStopId);
    if (!stop) return null;
    const dist = Math.round(haversineMeters(userCoords.lat, userCoords.lon, stop.lat, stop.lon));
    return { name: stop.publicName, dist };
  }, [isUsingGpsOrigin, userCoords, originStopId, catalog.stops]);

  return {
    originQuery,
    destinationQuery,
    setOriginQuery,
    setDestinationQuery,
    originStopId,
    destinationStopId,
    setOriginStopId,
    setDestinationStopId,
    selectOrigin,
    selectDestination,
    availableOrigins,
    availableDestinations,
    allStops,
    swapStops,
    userCoords,
    setUserCoords,
    isUsingGpsOrigin,
    setIsUsingGpsOrigin,
    nearStopName: nearInfo?.name ?? null,
    nearDistanceMeters: nearInfo?.dist ?? null,
    setCustomOriginLocation,
    clearCustomOrigin,
    selectedCategory,
    setSelectedCategory,
    state,
    setState,
    results,
    search,
    reset,
    graph,
  };
}
