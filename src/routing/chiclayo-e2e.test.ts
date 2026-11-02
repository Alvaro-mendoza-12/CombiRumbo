import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findItineraries } from './router';
import { validateCatalog } from '@/catalog/validator';

describe('Chiclayo Pilot End-to-End Real Trips', () => {
  const jsonPath = resolve(process.cwd(), 'data/recorridos-verificados.json');
  const catalogData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const { catalog, errors } = validateCatalog(catalogData);

  it('el catálogo verificado de Chiclayo es estructuralmente válido y sin errores', () => {
    expect(errors).toHaveLength(0);
    expect(catalog.cityId).toBe('chiclayo');
    expect(catalog.routes.length).toBeGreaterThanOrEqual(2);
    expect(catalog.stops.length).toBeGreaterThanOrEqual(8);
  });

  it('resuelve viaje directo Chiclayo Centro a Balneario de Pimentel', () => {
    const originStop = catalog.stops.find(s => s.publicName.includes('Bolognesi'))!;
    const destStop = catalog.stops.find(s => s.publicName.includes('Muelle'))!;

    expect(originStop).toBeDefined();
    expect(destStop).toBeDefined();

    const itineraries = findItineraries(catalog, originStop.id, destStop.id);
    expect(itineraries.length).toBeGreaterThan(0);

    const best = itineraries[0]!;
    expect(best.totalTransfers).toBe(0);
    expect(best.fare.confirmed).toBe(true);
    expect(best.fare.amount).toBe(2.5);
    expect(best.steps[0]!.route?.label).toContain('Pimentel');
  });

  it('resuelve viaje directo Mercado Moshoqueque a Hospital Las Mercedes', () => {
    const originStop = catalog.stops.find(s => s.publicName.includes('Moshoqueque'))!;
    const destStop = catalog.stops.find(s => s.publicName.includes('Las Mercedes'))!;

    expect(originStop).toBeDefined();
    expect(destStop).toBeDefined();

    const itineraries = findItineraries(catalog, originStop.id, destStop.id);
    expect(itineraries.length).toBeGreaterThan(0);

    const best = itineraries[0]!;
    expect(best.totalTransfers).toBe(0);
    expect(best.fare.confirmed).toBe(true);
    expect(best.fare.amount).toBe(1.5);
    expect(best.steps[0]!.route?.label).toContain('Línea 10');
  });

  it('comprueba que la demo en producción tiene cero datos ficticios TEST_', () => {
    for (const route of catalog.routes) {
      expect(route.id.startsWith('TEST_')).toBe(false);
      expect(route.label.includes('TEST')).toBe(false);
    }
    for (const stop of catalog.stops) {
      expect(stop.id.startsWith('TEST_')).toBe(false);
      expect(stop.publicName.includes('TEST')).toBe(false);
    }
    for (const seg of catalog.segments) {
      expect(seg.id.startsWith('TEST_')).toBe(false);
    }
  });
});
