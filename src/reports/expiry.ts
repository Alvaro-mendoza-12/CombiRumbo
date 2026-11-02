/**
 * Lógica de caducidad de reportes temporales.
 */

import type { LiveReport } from '@/catalog/types';
import { CATALOG_CONFIG } from '@/catalog/config';

/** True si el reporte ya expiró. */
export function isExpired(report: LiveReport, now: Date = new Date()): boolean {
  return new Date(report.expiresAt) <= now;
}

/** Minutos restantes antes de que expire el reporte. */
export function minutesUntilExpiry(report: LiveReport, now: Date = new Date()): number {
  const ms = new Date(report.expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 60000));
}

/** Calcula la fecha de expiración desde una fecha de creación. */
export function computeExpiry(createdAt: string): string {
  const d = new Date(createdAt);
  d.setMinutes(d.getMinutes() + CATALOG_CONFIG.reportExpiryMinutes);
  return d.toISOString();
}
