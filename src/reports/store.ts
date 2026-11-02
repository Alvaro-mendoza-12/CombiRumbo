/**
 * Almacenamiento local de reportes de pasajeros.
 * No guarda reporterId, IP ni ubicación del emisor.
 * Los reportes viven en localStorage, separados del catálogo verificado.
 */

import type { LiveReport, ReportKind } from '@/catalog/types';
import { CATALOG_CONFIG } from '@/catalog/config';

const REPORTS_KEY = 'combirumbo-reports';

export interface ReportStore {
  reports: LiveReport[];
}

function loadStore(): ReportStore {
  if (typeof localStorage === 'undefined') return { reports: [] };
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return { reports: [] };
    const parsed = JSON.parse(raw) as ReportStore;
    return { reports: Array.isArray(parsed.reports) ? parsed.reports : [] };
  } catch {
    return { reports: [] };
  }
}

function saveStore(store: ReportStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(store));
  } catch {
    // no crítico
  }
}

/** Crea y guarda un nuevo reporte. Devuelve el reporte creado o null si se rechazó. */
export function addReport(
  routeId: string,
  stopId: string | undefined,
  kind: ReportKind
): { ok: true; report: LiveReport } | { ok: false; reason: 'rate-limit' } {
  const store = loadStore();
  const now = new Date();

  // Verificar rate limit
  if (!canReport(store, routeId, now)) {
    return { ok: false, reason: 'rate-limit' };
  }

  const expiresAt = new Date(
    now.getTime() + CATALOG_CONFIG.reportExpiryMinutes * 60 * 1000
  ).toISOString();

  // countBucket: número de reportes activos para esta ruta (para mostrar "1 reporte", "2 reportes")
  const activeForRoute = store.reports.filter(
    r => r.routeId === routeId && new Date(r.expiresAt) > now
  );

  const report: LiveReport = {
    id: `rep-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    routeId,
    stopId,
    kind,
    createdAt: now.toISOString(),
    expiresAt: expiresAt,
    countBucket: activeForRoute.length + 1,
  };

  store.reports.push(report);
  saveStore(store);
  return { ok: true, report };
}

/** Devuelve los reportes no expirados para una ruta específica. */
export function getActiveReports(routeId: string, now: Date = new Date()): LiveReport[] {
  const store = loadStore();
  return store.reports
    .filter(r => r.routeId === routeId && new Date(r.expiresAt) > now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Devuelve todos los reportes no expirados. */
export function getAllActiveReports(now: Date = new Date()): LiveReport[] {
  const store = loadStore();
  return store.reports.filter(r => new Date(r.expiresAt) > now);
}

/** Elimina reportes expirados del almacenamiento. */
export function pruneExpired(now: Date = new Date()): void {
  const store = loadStore();
  const active = store.reports.filter(r => new Date(r.expiresAt) > now);
  if (active.length !== store.reports.length) {
    saveStore({ reports: active });
  }
}

/** Verifica si se puede enviar un reporte (rate limit por ruta y bucket de tiempo). */
export function canReport(
  store: ReportStore,
  routeId: string,
  now: Date
): boolean {
  const bucketStart = new Date(now);
  bucketStart.setMinutes(
    bucketStart.getMinutes() - CATALOG_CONFIG.rateLimitBucketMinutes
  );

  const recentCount = store.reports.filter(
    r => r.routeId === routeId && new Date(r.createdAt) >= bucketStart
  ).length;

  return recentCount < CATALOG_CONFIG.maxReportsPerBucket;
}

/** Devuelve el conteo agregado de reportes expirados (sin identificadores). */
export function getExpiredReportCounts(routeId: string, now: Date = new Date()): number {
  const store = loadStore();
  return store.reports.filter(
    r => r.routeId === routeId && new Date(r.expiresAt) <= now
  ).length;
}
