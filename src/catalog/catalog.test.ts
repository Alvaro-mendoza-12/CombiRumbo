import { describe, it, expect } from 'vitest';
import {
  isCatalogEmpty,
  getEffectiveStatus,
  getEligibleSegments,
  getAgingSegments,
  loadCatalog,
} from './catalog';
import type { Catalog, Route, Segment } from './types';

describe('Catalog querying and aging lifecycle', () => {
  const TEST_ROUTE_ACTIVE: Route = {
    id: 'TEST_R1',
    cityId: 'chiclayo',
    label: 'Ruta Activa',
    status: 'verified',
    sourceId: 'TEST_SRC',
    verifiedAt: '2026-11-01T00:00:00Z',
    reviewAfter: '2026-12-01T00:00:00Z', // Futuro
  };

  const TEST_ROUTE_EXPIRED: Route = {
    id: 'TEST_R2',
    cityId: 'chiclayo',
    label: 'Ruta Antigua',
    status: 'verified',
    sourceId: 'TEST_SRC',
    verifiedAt: '2026-09-01T00:00:00Z',
    reviewAfter: '2026-10-01T00:00:00Z', // Pasado respecto a nov 2026
  };

  const TEST_SEG_ACTIVE: Segment = {
    id: 'TEST_SEG_1',
    routeId: 'TEST_R1',
    fromStopId: 'TEST_S1',
    toStopId: 'TEST_S2',
    sourceId: 'TEST_SRC',
    evidenceMethod: 'field-observation',
    status: 'verified',
    observedAt: '2026-11-01T00:00:00Z',
  };

  const TEST_SEG_EXPIRED: Segment = {
    id: 'TEST_SEG_2',
    routeId: 'TEST_R2',
    fromStopId: 'TEST_S3',
    toStopId: 'TEST_S4',
    sourceId: 'TEST_SRC',
    evidenceMethod: 'field-observation',
    status: 'verified',
    observedAt: '2026-09-01T00:00:00Z',
  };

  const TEST_CATALOG: Catalog = {
    schemaVersion: 1,
    cityId: 'chiclayo',
    cityName: 'Chiclayo',
    lastUpdated: '2026-11-01T00:00:00Z',
    routes: [TEST_ROUTE_ACTIVE, TEST_ROUTE_EXPIRED],
    stops: [
      { id: 'TEST_S1', cityId: 'chiclayo', publicName: 'P1', lat: -6.77, lon: -79.84, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      { id: 'TEST_S2', cityId: 'chiclayo', publicName: 'P2', lat: -6.78, lon: -79.85, sourceId: 'TEST_SRC', verifiedAt: '2026-11-01T00:00:00Z' },
      { id: 'TEST_S3', cityId: 'chiclayo', publicName: 'P3', lat: -6.77, lon: -79.84, sourceId: 'TEST_SRC', verifiedAt: '2026-09-01T00:00:00Z' },
      { id: 'TEST_S4', cityId: 'chiclayo', publicName: 'P4', lat: -6.78, lon: -79.85, sourceId: 'TEST_SRC', verifiedAt: '2026-09-01T00:00:00Z' },
    ],
    segments: [TEST_SEG_ACTIVE, TEST_SEG_EXPIRED],
    sources: [{ id: 'TEST_SRC', type: 'field-observation', title: 'Test Src', observedAt: '2026-11-01T00:00:00Z' }],
  };

  const TEST_NOW = new Date('2026-11-02T12:00:00Z');

  it('determina correctamente si el catálogo está vacío', () => {
    const empty = {
      schemaVersion: 1,
      cityId: 'chiclayo',
      cityName: 'Chiclayo',
      lastUpdated: null,
      routes: [],
      stops: [],
      segments: [],
      sources: [],
    };
    expect(isCatalogEmpty(empty)).toBe(true);
    expect(isCatalogEmpty(TEST_CATALOG)).toBe(false);
  });

  it('evalúa envejecimiento: cambia a aging cuando reviewAfter venció', () => {
    const statusActive = getEffectiveStatus(TEST_SEG_ACTIVE, TEST_ROUTE_ACTIVE, TEST_NOW);
    expect(statusActive).toBe('verified');

    const statusExpired = getEffectiveStatus(TEST_SEG_EXPIRED, TEST_ROUTE_EXPIRED, TEST_NOW);
    expect(statusExpired).toBe('aging');
  });

  it('filtra elegibles excluyendo segmentos con fecha de revisión vencida', () => {
    const eligible = getEligibleSegments(TEST_CATALOG, TEST_NOW);
    expect(eligible).toHaveLength(1);
    expect(eligible[0]!.id).toBe('TEST_SEG_1');

    const aging = getAgingSegments(TEST_CATALOG, TEST_NOW);
    expect(aging).toHaveLength(1);
    expect(aging[0]!.id).toBe('TEST_SEG_2');
  });

  it('carga catálogo desde JSON crudo y valida integridad', () => {
    const { catalog, errors } = loadCatalog(TEST_CATALOG);
    expect(errors).toHaveLength(0);
    expect(catalog.routes).toHaveLength(2);
  });
});
