import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCatalogToCache,
  loadCachedCatalog,
  getCachedSyncDate,
  hasCachedCatalog,
} from './cache';
import type { Catalog } from '@/catalog/types';

describe('PWA Cache for Offline Mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const TEST_CATALOG: Catalog = {
    schemaVersion: 1,
    cityId: 'chiclayo',
    cityName: 'Chiclayo',
    lastUpdated: '2026-11-01T10:00:00Z',
    routes: [
      {
        id: 'TEST_R1',
        cityId: 'chiclayo',
        label: 'Línea 10',
        status: 'verified',
        sourceId: 'TEST_SRC',
        verifiedAt: '2026-11-01T10:00:00Z',
        reviewAfter: '2026-12-01T10:00:00Z',
      },
    ],
    stops: [],
    segments: [],
    sources: [],
  };

  it('guarda y recupera el catálogo cacheado con marca de fecha', () => {
    expect(hasCachedCatalog()).toBe(false);

    saveCatalogToCache(TEST_CATALOG);

    expect(hasCachedCatalog()).toBe(true);
    const cached = loadCachedCatalog();
    expect(cached.cityId).toBe('chiclayo');
    expect(cached.routes).toHaveLength(1);

    const syncDate = getCachedSyncDate();
    expect(syncDate).not.toBeNull();
    expect(new Date(syncDate!).getTime()).toBeGreaterThan(0);
  });
});
