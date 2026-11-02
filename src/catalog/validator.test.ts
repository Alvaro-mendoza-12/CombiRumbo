import { describe, it, expect } from 'vitest';
import {
  isValidCoordinate,
  isValidDate,
  validateRoute,
  validateStop,
  validateSegment,
  validateSource,
  validateCatalog,
} from './validator';
import type { Route, Stop, Segment, Source, Catalog } from './types';
import { CHICLAYO_CITY_CONFIG } from './config';

describe('Catalog Validator', () => {
  const TEST_VALID_SOURCE: Source = {
    id: 'TEST_SRC_01',
    type: 'field-observation',
    title: 'Observación en campo TEST',
    observedAt: '2026-11-01T10:00:00Z',
    notes: 'Prueba de validación',
  };

  const TEST_VALID_ROUTE: Route = {
    id: 'TEST_ROUTE_01',
    cityId: 'chiclayo',
    label: 'Línea TEST 10',
    direction: 'Norte - Sur',
    status: 'verified',
    sourceId: 'TEST_SRC_01',
    verifiedAt: '2026-11-01T10:00:00Z',
    reviewAfter: '2026-12-01T10:00:00Z',
  };

  const TEST_VALID_STOP_A: Stop = {
    id: 'TEST_STOP_A',
    cityId: 'chiclayo',
    publicName: 'Parque Principal Chiclayo',
    lat: -6.7715,
    lon: -79.8400,
    sourceId: 'TEST_SRC_01',
    verifiedAt: '2026-11-01T10:00:00Z',
  };

  const TEST_VALID_STOP_B: Stop = {
    id: 'TEST_STOP_B',
    cityId: 'chiclayo',
    publicName: 'Óvalo Quiñones',
    lat: -6.7780,
    lon: -79.8450,
    sourceId: 'TEST_SRC_01',
    verifiedAt: '2026-11-01T10:00:00Z',
  };

  const TEST_VALID_SEGMENT: Segment = {
    id: 'TEST_SEG_01',
    routeId: 'TEST_ROUTE_01',
    fromStopId: 'TEST_STOP_A',
    toStopId: 'TEST_STOP_B',
    fare: 2.0,
    fareUnit: 'S/',
    sourceId: 'TEST_SRC_01',
    evidenceMethod: 'field-observation',
    status: 'verified',
    observedAt: '2026-11-01T10:00:00Z',
  };

  it('valida coordenadas dentro y fuera del rango de Chiclayo', () => {
    // Centro de Chiclayo
    expect(isValidCoordinate(-6.7715, -79.8400, CHICLAYO_CITY_CONFIG)).toBe(true);
    // Fuera de Chiclayo (Lima: -12.0464, -77.0428)
    expect(isValidCoordinate(-12.0464, -77.0428, CHICLAYO_CITY_CONFIG)).toBe(false);
    // Coordenadas NaN o inválidas
    expect(isValidCoordinate(NaN, -79.8400, CHICLAYO_CITY_CONFIG)).toBe(false);
  });

  it('valida fechas ISO 8601', () => {
    expect(isValidDate('2026-11-01T10:00:00Z')).toBe(true);
    expect(isValidDate('2026-11-01')).toBe(true);
    expect(isValidDate('fecha-invalida')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it('valida una ruta correcta y rechaza rutas sin procedencia o con status inválido', () => {
    expect(validateSource(TEST_VALID_SOURCE)).toBe(true);
    expect(validateSource({ id: 'bad' })).toBe(false);
    expect(validateRoute(TEST_VALID_ROUTE, [TEST_VALID_SOURCE])).toBe(true);

    const TEST_NO_SOURCE = { ...TEST_VALID_ROUTE, sourceId: '' };
    expect(validateRoute(TEST_NO_SOURCE, [TEST_VALID_SOURCE])).toBe(false);

    const TEST_BAD_STATUS = { ...TEST_VALID_ROUTE, status: 'invalid-status' };
    expect(validateRoute(TEST_BAD_STATUS, [TEST_VALID_SOURCE])).toBe(false);
  });

  it('valida paraderos dentro de la ciudad y rechaza coordenadas fuera de rango', () => {
    expect(validateStop(TEST_VALID_STOP_A, CHICLAYO_CITY_CONFIG)).toBe(true);

    const TEST_OUTSIDE_STOP = {
      ...TEST_VALID_STOP_A,
      lat: -12.0464, // Lima
      lon: -77.0428,
    };
    expect(validateStop(TEST_OUTSIDE_STOP, CHICLAYO_CITY_CONFIG)).toBe(false);
  });

  it('valida segmentos con tarifa opcional y rechaza tarifas negativas', () => {
    expect(validateSegment(TEST_VALID_SEGMENT)).toBe(true);

    const TEST_SEG_NO_FARE = { ...TEST_VALID_SEGMENT, fare: undefined, fareUnit: undefined };
    expect(validateSegment(TEST_SEG_NO_FARE)).toBe(true);

    const TEST_SEG_NEGATIVE_FARE = { ...TEST_VALID_SEGMENT, fare: -5 };
    expect(validateSegment(TEST_SEG_NEGATIVE_FARE)).toBe(false);
  });

  it('valida un catálogo vacío como estado válido del producto', () => {
    const rawEmpty = {
      schemaVersion: 1,
      cityId: 'chiclayo',
      cityName: 'Chiclayo',
      lastUpdated: null,
      routes: [],
      stops: [],
      segments: [],
      sources: [],
    };
    const { catalog, errors } = validateCatalog(rawEmpty);
    expect(catalog.routes).toHaveLength(0);
    expect(catalog.segments).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(catalog.cityId).toBe('chiclayo');
  });

  it('valida un catálogo completo y descarta referencias rotas', () => {
    const rawValidCatalog: Catalog = {
      schemaVersion: 1,
      cityId: 'chiclayo',
      cityName: 'Chiclayo',
      lastUpdated: '2026-11-01T12:00:00Z',
      routes: [TEST_VALID_ROUTE],
      stops: [TEST_VALID_STOP_A, TEST_VALID_STOP_B],
      segments: [TEST_VALID_SEGMENT],
      sources: [TEST_VALID_SOURCE],
    };

    const { catalog, errors } = validateCatalog(rawValidCatalog);
    expect(errors).toHaveLength(0);
    expect(catalog.routes).toHaveLength(1);
    expect(catalog.stops).toHaveLength(2);
    expect(catalog.segments).toHaveLength(1);

    // Si un segmento apunta a un stop inexistente, se descarta
    const rawBrokenCatalog = {
      ...rawValidCatalog,
      segments: [
        {
          ...TEST_VALID_SEGMENT,
          toStopId: 'STOP_NO_EXISTE',
        },
      ],
    };
    const brokenResult = validateCatalog(rawBrokenCatalog);
    expect(brokenResult.catalog.segments).toHaveLength(0);
    expect(brokenResult.errors.length).toBeGreaterThan(0);
  });
});
