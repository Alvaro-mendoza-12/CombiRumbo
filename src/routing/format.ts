/**
 * Tipos de itinerario formateado y utilidades de presentación.
 */

import type { Route, Segment, Source, Stop, SegmentStatus } from '@/catalog/types';

export interface ItineraryStep {
  type: 'walk' | 'ride';
  label: string;
  fromStop?: Stop;
  toStop?: Stop;
  route?: Route;
  segment?: Segment;
  boardingNote?: string;
  alightingNote?: string;
  fare?: { amount: number; unit: string };
  source?: Source;
  observedAt?: string;
  status: SegmentStatus;
  walkMeters?: number;
}

export interface Itinerary {
  id: string;
  steps: ItineraryStep[];
  totalTransfers: number;
  estimatedWalkMeters: number;
  estimatedWalkSeconds: number;
  orderingCriteria: string;
  verificationDate: string;
  fare: {
    amount: number | null;
    unit: string;
    confirmed: boolean;
  };
}

/** Formatea una fecha ISO a texto legible en español. */
export function formatDate(isoDate: string, lang: 'es' | 'en' = 'es'): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  if (lang === 'es') {
    return d.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Formatea hace cuántos minutos desde una fecha ISO. */
export function formatMinutesAgo(isoDate: string, now: Date = new Date()): number {
  const d = new Date(isoDate);
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
}
