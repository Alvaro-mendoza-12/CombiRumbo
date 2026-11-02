import { describe, it, expect } from 'vitest';
import { getStatusVisual, haversineMeters, formatDistance } from './a11y';
import { translate } from './i18n';

describe('Accessibility & i18n', () => {
  it('getStatusVisual comunica el estado con icono y texto para no depender solo del color', () => {
    const verified = getStatusVisual('verified');
    expect(verified.icon).toBe('✅');
    expect(verified.labelKey).toBe('status.verified');
    expect(verified.className).toBe('status-verified');

    const aging = getStatusVisual('aging');
    expect(aging.icon).toBe('⏰');
    expect(aging.labelKey).toBe('status.aging');

    const unverified = getStatusVisual('unverified');
    expect(unverified.icon).toBe('❌');
    expect(unverified.labelKey).toBe('status.unverified');

    const retired = getStatusVisual('retired');
    expect(retired.icon).toBe('⛔');
    expect(retired.labelKey).toBe('status.retired');
  });

  it('calcula distancias haversine y las formatea de manera legible', () => {
    // Distancia Parque Principal a Óvalo Quiñones (~900m a 1km)
    const dist = haversineMeters(-6.7715, -79.8400, -6.7780, -79.8450);
    expect(dist).toBeGreaterThan(500);
    expect(dist).toBeLessThan(1500);

    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('traduce textos en español e inglés interpolando variables', () => {
    const esText = translate('results.manyOptions', 'es', { count: 3 });
    expect(esText).toBe('3 opciones verificadas');

    const enText = translate('results.manyOptions', 'en', { count: 3 });
    expect(enText).toBe('3 verified options');

    const privacyEs = translate('app.privacyNote', 'es');
    expect(privacyEs).toContain('No guardamos por dónde viajas');
  });
});
