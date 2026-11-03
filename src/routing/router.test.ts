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

  it('genera itinerario de caminata directa si los paraderos están a menos de 280 metros', () => {
    const catalogClose: Catalog = {
      ...TEST_CATALOG,
      stops: [
        { id: 'CLOSE_A', cityId: 'chiclayo', publicName: 'Punto A', lat: -6.7715, lon: -79.8400, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
        { id: 'CLOSE_B', cityId: 'chiclayo', publicName: 'Punto B', lat: -6.7725, lon: -79.8405, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' }, // ~120m
      ],
      segments: [],
    };
    const itineraries = findItineraries(catalogClose, 'CLOSE_A', 'CLOSE_B', TEST_NOW);
    expect(itineraries).toHaveLength(1);
    const itin = itineraries[0]!;
    expect(itin.tags).toContain('walking-only');
    expect(itin.steps).toHaveLength(1);
    expect(itin.steps[0]!.type).toBe('direct-walk');
    expect(itin.fare.amount).toBe(0);
    expect(itin.fare.confirmed).toBe(true);
  });

  it('calcula tarifa única por vehículo aunque recorra múltiples tramos de la misma ruta', () => {
    const multiSegmentCatalog: Catalog = {
      ...TEST_CATALOG,
      stops: [
        { id: 'S1', cityId: 'chiclayo', publicName: 'Parada 1', lat: -6.7710, lon: -79.8400, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
        { id: 'S2', cityId: 'chiclayo', publicName: 'Parada 2', lat: -6.7750, lon: -79.8420, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
        { id: 'S3', cityId: 'chiclayo', publicName: 'Parada 3', lat: -6.7800, lon: -79.8450, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      ],
      segments: [
        { id: 'SEG1', routeId: 'TEST_R1', fromStopId: 'S1', toStopId: 'S2', fare: 2.5, fareUnit: 'S/', sourceId: 'TEST_SRC', evidenceMethod: 'field-observation', status: 'verified', observedAt: '2026-11-01T00:00:00Z' },
        { id: 'SEG2', routeId: 'TEST_R1', fromStopId: 'S2', toStopId: 'S3', fare: 2.5, fareUnit: 'S/', sourceId: 'TEST_SRC', evidenceMethod: 'field-observation', status: 'verified', observedAt: '2026-11-01T00:00:00Z' },
      ],
    };
    const itineraries = findItineraries(multiSegmentCatalog, 'S1', 'S3', TEST_NOW);
    expect(itineraries).toHaveLength(1);
    const itin = itineraries[0]!;
    expect(itin.totalTransfers).toBe(0);
    expect(itin.fare.amount).toBe(2.5); // Tarifa cobrada 1 vez para la misma combi
  });
});
