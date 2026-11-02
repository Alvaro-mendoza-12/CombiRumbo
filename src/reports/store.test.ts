import { describe, it, expect, beforeEach } from 'vitest';
import {
  addReport,
  getActiveReports,
  getAllActiveReports,
  pruneExpired,
  getExpiredReportCounts,
} from './store';
import { isExpired, minutesUntilExpiry } from './expiry';

describe('Passenger Reports Store & Expiry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite a un pasajero registrar un reporte con hora y vencimiento a 20 min', () => {
    const res = addReport('TEST_ROUTE_A', 'TEST_STOP_A', 'unit-passed');
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const report = res.report;
    expect(report.routeId).toBe('TEST_ROUTE_A');
    expect(report.stopId).toBe('TEST_STOP_A');
    expect(report.kind).toBe('unit-passed');
    expect(report.countBucket).toBe(1);

    const active = getActiveReports('TEST_ROUTE_A');
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe(report.id);

    // No debe estar expirado al crearse
    expect(isExpired(report)).toBe(false);
    expect(minutesUntilExpiry(report)).toBeGreaterThan(0);
    expect(minutesUntilExpiry(report)).toBeLessThanOrEqual(20);
  });

  it('hace expirar reportes tras 20 minutos sin alterar el catálogo base', () => {
    const res = addReport('TEST_ROUTE_B', undefined, 'unit-absent');
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const report = res.report;
    // Simular tiempo futuro (25 minutos después)
    const futureDate = new Date(Date.now() + 25 * 60 * 1000);

    expect(isExpired(report, futureDate)).toBe(true);

    const activeFuture = getActiveReports('TEST_ROUTE_B', futureDate);
    expect(activeFuture).toHaveLength(0);

    // Podar expirados
    pruneExpired(futureDate);
    expect(getAllActiveReports(futureDate)).toHaveLength(0);

    // Conteo agregado histórico
    expect(getExpiredReportCounts('TEST_ROUTE_B', futureDate)).toBe(0);
  });

  it('aplica rate-limiting para proteger contra spam (máximo 10 por bucket de 5 min)', () => {
    for (let i = 0; i < 10; i++) {
      const res = addReport('TEST_ROUTE_SPAM', undefined, 'unit-passed');
      expect(res.ok).toBe(true);
    }

    // El reporte 11 en el mismo intervalo de 5 minutos debe ser rechazado
    const excessRes = addReport('TEST_ROUTE_SPAM', undefined, 'unit-passed');
    expect(excessRes.ok).toBe(false);
    if (!excessRes.ok) {
      expect(excessRes.reason).toBe('rate-limit');
    }
  });
});
