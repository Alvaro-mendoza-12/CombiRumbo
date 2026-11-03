import { describe, it, expect } from 'vitest';
import { CHICLAYO_PLACES, searchLocalPlaces } from './places';
import { CHICLAYO_CITY_CONFIG, SUPPORTED_CITIES_LIST } from '../catalog/config';

describe('Chiclayo POI Directory & Geocoding', () => {
  it('contains critical universities including USMP, USS, USAT, UNPRG', () => {
    const ids = CHICLAYO_PLACES.map(p => p.id);
    expect(ids).toContain('place-usmp');
    expect(ids).toContain('place-uss');
    expect(ids).toContain('place-usat');
    expect(ids).toContain('place-unprg');
    expect(ids).toContain('place-real-plaza');
  });

  it('matches USMP by abbreviation and by full name', () => {
    const matchesAbbr = searchLocalPlaces('USMP');
    expect(matchesAbbr.length).toBeGreaterThan(0);
    expect(matchesAbbr[0]?.id).toBe('place-usmp');

    const matchesFull = searchLocalPlaces('San Martín');
    expect(matchesFull.length).toBeGreaterThan(0);
    expect(matchesFull[0]?.id).toBe('place-usmp');
  });

  it('matches Mall Aventura and Real Plaza', () => {
    const realPlaza = searchLocalPlaces('Real Plaza');
    expect(realPlaza.length).toBeGreaterThan(0);
    expect(realPlaza[0]?.id).toBe('place-real-plaza');

    const aventura = searchLocalPlaces('Mall Aventura');
    expect(aventura.length).toBeGreaterThan(0);
    expect(aventura[0]?.id).toBe('place-mall-aventura');
  });

  it('correctly maps USMP to verified transit stop', () => {
    const usmp = CHICLAYO_PLACES.find(p => p.id === 'place-usmp');
    expect(usmp).toBeDefined();
    expect(usmp?.transitStopId).toBe('stop-usmp-campus-chiclayo');
    expect(usmp?.isVerifiedTransitStop).toBe(true);
  });
});

describe('Multi-City International Architecture', () => {
  it('defines Chiclayo as the sole active pilot', () => {
    expect(CHICLAYO_CITY_CONFIG.pilotStatus).toBe('active-pilot');
    expect(CHICLAYO_CITY_CONFIG.countryCode).toBe('PE');
    expect(CHICLAYO_CITY_CONFIG.currency).toBe('PEN');
  });

  it('includes planned international cities with complete metadata', () => {
    const cities = SUPPORTED_CITIES_LIST;
    expect(cities.length).toBe(5);

    const bogota = cities.find(c => c.id === 'bogota');
    expect(bogota).toBeDefined();
    expect(bogota?.countryCode).toBe('CO');
    expect(bogota?.currency).toBe('COP');
    expect(bogota?.pilotStatus).toBe('planned');

    const cdmx = cities.find(c => c.id === 'cdmx');
    expect(cdmx).toBeDefined();
    expect(cdmx?.countryCode).toBe('MX');
    expect(cdmx?.currency).toBe('MXN');
  });
});
