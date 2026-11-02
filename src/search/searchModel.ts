/**
 * Estado de búsqueda y resultados.
 * Maneja origen, destino, resultados y estado de la búsqueda.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Catalog } from '@/catalog/types';
import type { Itinerary } from '@/routing/format';
import { findItineraries } from '@/routing/router';
import { isCatalogEmpty, getStopNames } from '@/catalog/catalog';
import { buildGraph } from '@/routing/graph';

export type SearchState = 'idle' | 'searching' | 'results' | 'no-results' | 'empty-catalog';

export interface SearchModel {
  originQuery: string;
  destinationQuery: string;
  originStopId: string | null;
  destinationStopId: string | null;
  state: SearchState;
  results: Itinerary[];
}

export function useSearch(catalog: Catalog) {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originStopId, setOriginStopId] = useState<string | null>(null);
  const [destinationStopId, setDestinationStopId] = useState<string | null>(null);
  const [state, setState] = useState<SearchState>('idle');
  const [results, setResults] = useState<Itinerary[]>([]);

  const stopNames = useMemo(() => getStopNames(catalog), [catalog]);
  const graph = useMemo(() => buildGraph(catalog), [catalog]);

  const search = useCallback(
    (fromId: string, toId: string) => {
      if (isCatalogEmpty(catalog)) {
        setState('empty-catalog');
        setResults([]);
        return;
      }

      setState('searching');
      const itineraries = findItineraries(catalog, fromId, toId);
      if (itineraries.length === 0) {
        setState('no-results');
        setResults([]);
      } else {
        setState('results');
        setResults(itineraries);
      }
    },
    [catalog]
  );

  const reset = useCallback(() => {
    setState('idle');
    setResults([]);
  }, []);

  return {
    originQuery,
    destinationQuery,
    setOriginQuery,
    setDestinationQuery,
    originStopId,
    destinationStopId,
    setOriginStopId,
    setDestinationStopId,
    state,
    results,
    search,
    reset,
    stopNames,
    graph,
  };
}
