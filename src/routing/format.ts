/**
 * Tipos de itinerario formateado y utilidades de presentación.
 */

import type { Route, Segment, Source, Stop, SegmentStatus } from '@/catalog/types';

export type StepType = 'walk' | 'ride' | 'transfer' | 'direct-walk';

export interface ItineraryStep {
  type: StepType;
  label: string;
  fromStop?: Stop;
  toStop?: Stop;
  route?: Route;
  segment?: Segment;
  boardingNote?: string;
  boardingTip?: string;
  vehicleSign?: string;
  vehicleDescription?: string;
  alightingNote?: string;
  alightingTip?: string;
  fare?: { amount: number; unit: string };
  source?: Source;
  observedAt?: string;
  status: SegmentStatus;
  walkMeters?: number;
  durationMinutes?: number;
  geometry?: [number, number][];
}

export interface Itinerary {
  id: string;
  steps: ItineraryStep[];
  totalTransfers: number;
  estimatedWalkMeters: number;
  estimatedWalkSeconds: number;
  estimatedRideMinutes: number;
  estimatedTotalMinutes: number;
  tag: 'recommended' | 'direct' | 'least-walking' | 'walking-only';
  tags: string[];
  totalWalkMinutes: number;
  totalWalkMeters: number;
  tagLabel: string;
  summary: string;
  orderingCriteria: string;
  verificationDate: string;
  fare: {
    amount: number | null;
    unit: string;
    confirmed: boolean;
  };
}

/** Formatea una fecha ISO a texto legible en español o inglés. */
export function formatDate(isoDate: string, lang: 'es' | 'en' = 'es'): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  if (lang === 'es') {
    return d.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formatea hace cuántos minutos desde una fecha ISO. */
export function formatMinutesAgo(isoDate: string, now: Date = new Date()): number {
  const d = new Date(isoDate);
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
}
