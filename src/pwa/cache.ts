/**
 * Caché del catálogo en localStorage.
 * Guarda el catálogo con marca de fecha de sincronización.
 * No guarda ubicación del usuario ni historial de viajes.
 */

import type { Catalog } from '@/catalog/types';
import { EMPTY_CATALOG } from '@/catalog/types';

const CATALOG_KEY = 'combirumbo-catalog';
const SYNC_KEY = 'combirumbo-catalog-sync';

/** Guarda el catálogo en caché con timestamp de sincronización. */
export function saveCatalogToCache(catalog: Catalog): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
    localStorage.setItem(SYNC_KEY, new Date().toISOString());
  } catch {
    // localStorage lleno o no disponible; no es crítico.
  }
}

/** Carga el catálogo desde caché. */
export function loadCachedCatalog(): Catalog {
  if (typeof localStorage === 'undefined') return { ...EMPTY_CATALOG };
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return { ...EMPTY_CATALOG };
    return JSON.parse(raw) as Catalog;
  } catch {
    return { ...EMPTY_CATALOG };
  }
}

/** Devuelve la fecha de la última sincronización del catálogo cacheado. */
export function getCachedSyncDate(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(SYNC_KEY);
  } catch {
    return null;
  }
}

/** True si hay un catálogo cacheado con datos. */
export function hasCachedCatalog(): boolean {
  const cached = loadCachedCatalog();
  return cached.routes.length > 0 || cached.segments.length > 0;
}
