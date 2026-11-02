import { describe, it, expect } from 'vitest';
import { findItineraries } from './router';
import type { Catalog } from '@/catalog/types';

describe('Router & Itinerary Search', () => {
  const TEST_NOW = new Date('2026-11-02T12:00:00Z');

  const TEST_CATALOG: Catalog = {
    schemaVersion: 1,
    cityId: 'chiclayo',
    cityName: 'Chiclayo',
    lastUpdated: '2026-11-01T00:00:00Z',
    routes: [
      {
        id: 'TEST_R1',
        cityId: 'chiclayo',
        label: 'Línea 10',
        status: 'verified',
        sourceId: 'TEST_SRC',
        verifiedAt: '2026-11-01T00:00:00Z',
        reviewAfter: '2026-12-01T00:00:00Z',
      },
      {
        id: 'TEST_R2',
        cityId: 'chiclayo',
        label: 'Combi Pimentel',
        status: 'verified',
        sourceId: 'TEST_SRC',
        verifiedAt: '2026-11-01T00:00:00Z',
        reviewAfter: '2026-12-01T00:00:00Z',
      },
      {
        id: 'TEST_R_OLD',
        cityId: 'chiclayo',
        label: 'Línea Vencida',
        status: 'verified',
        sourceId: 'TEST_SRC',
        verifiedAt: '2026-08-01T00:00:00Z',
        reviewAfter: '2026-09-01T00:00:00Z', // Vencida
      },
    ],
    stops: [
      { id: 'TEST_STOP_1', cityId: 'chiclayo', publicName: 'Parque Principal', lat: -6.7715, lon: -79.8400, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      { id: 'TEST_STOP_2', cityId: 'chiclayo', publicName: 'Óvalo Quiñones', lat: -6.7780, lon: -79.8450, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      { id: 'TEST_STOP_3', cityId: 'chiclayo', publicName: 'Balneario Pimentel', lat: -6.8350, lon: -79.9340, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      { id: 'TEST_STOP_ISOLATED', cityId: 'chiclayo', publicName: 'Lugar Sin Cobertura', lat: -6.7900, lon: -79.8600, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
    ],
    segments: [
      {
        id: 'TEST_SEG_1_2',
        routeId: 'TEST_R1',
        fromStopId: 'TEST_STOP_1',
        toStopId: 'TEST_STOP_2',
        fare: 2.0,
        fareUnit: 'S/',
        sourceId: 'TEST_SRC',
        evidenceMethod: 'field-observation',
        status: 'verified',
        observedAt: '2026-11-01T00:00:00Z',
      },
      {
        id: 'TEST_SEG_2_3',
        routeId: 'TEST_R2',
        fromStopId: 'TEST_STOP_2',
        toStopId: 'TEST_STOP_3',
        fare: 2.5,
        fareUnit: 'S/',
        sourceId: 'TEST_SRC',
        evidenceMethod: 'field-observation',
        status: 'verified',
        observedAt: '2026-11-01T00:00:00Z',
      },
      {
        id: 'TEST_SEG_OLD',
        routeId: 'TEST_R_OLD',
        fromStopId: 'TEST_STOP_1',
        toStopId: 'TEST_STOP_ISOLATED',
        fare: 1.5,
        fareUnit: 'S/',
        sourceId: 'TEST_SRC',
        evidenceMethod: 'field-observation',
        status: 'verified',
        observedAt: '2026-08-01T00:00:00Z',
      },
    ],
    sources: [
      { id: 'TEST_SRC', type: 'field-observation', title: 'Observación Test', observedAt: '2026-11-01T00:00:00Z' },
    ],
  };

  it('encuentra una ruta directa verificada con tarifa confirmada', () => {
    const itineraries = findItineraries(TEST_CATALOG, 'TEST_STOP_1', 'TEST_STOP_2', TEST_NOW);
    expect(itineraries).toHaveLength(1);
    const itin = itineraries[0]!;
    expect(itin.totalTransfers).toBe(0);
    expect(itin.steps).toHaveLength(1);
    expect(itin.steps[0]!.type).toBe('ride');
    expect(itin.steps[0]!.route?.label).toBe('Línea 10');
    expect(itin.fare.confirmed).toBe(true);
    expect(itin.fare.amount).toBe(2.0);
  });

  it('encuentra una ruta con 1 transbordo y suma tarifas', () => {
    const itineraries = findItineraries(TEST_CATALOG, 'TEST_STOP_1', 'TEST_STOP_3', TEST_NOW);
    expect(itineraries.length).toBeGreaterThan(0);
    const itin = itineraries[0]!;
    expect(itin.totalTransfers).toBe(1);
    expect(itin.steps.filter(s => s.type === 'ride')).toHaveLength(2);
    expect(itin.fare.confirmed).toBe(true);
    expect(itin.fare.amount).toBe(4.5); // 2.0 + 2.5
  });

  it('devuelve vacío sin inventar si no hay camino en el grafo verificado', () => {
    // TEST_STOP_3 a TEST_STOP_1 no tiene ruta en reversa en los datos
    const itineraries = findItineraries(TEST_CATALOG, 'TEST_STOP_3', 'TEST_STOP_1', TEST_NOW);
    expect(itineraries).toHaveLength(0);
  });

  it('no ofrece rutas cuyos datos estén vencidos (aging)', () => {
    // La conexión a TEST_STOP_ISOLATED sólo existe en la ruta vencida TEST_R_OLD
    const itineraries = findItineraries(TEST_CATALOG, 'TEST_STOP_1', 'TEST_STOP_ISOLATED', TEST_NOW);
    expect(itineraries).toHaveLength(0);
  });

  it('marca tarifa como por confirmar si falta evidencia en algún tramo', () => {
    const catalogWithoutFare: Catalog = {
      ...TEST_CATALOG,
      segments: [
        {
          ...TEST_CATALOG.segments[0]!,
          fare: undefined,
        },
      ],
    };

    const itineraries = findItineraries(catalogWithoutFare, 'TEST_STOP_1', 'TEST_STOP_2', TEST_NOW);
    expect(itineraries).toHaveLength(1);
    expect(itineraries[0]!.fare.confirmed).toBe(false);
    expect(itineraries[0]!.fare.amount).toBeNull();
  });

  it('devuelve vacío si origen y destino son idénticos', () => {
    const itineraries = findItineraries(TEST_CATALOG, 'TEST_STOP_1', 'TEST_STOP_1', TEST_NOW);
    expect(itineraries).toHaveLength(0);
  });
});
