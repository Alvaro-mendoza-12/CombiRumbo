import { describe, it, expect } from 'vitest';
import { parseCsv, importFromCsv } from './importer';

describe('Catalog CSV Importer', () => {
  const TEST_VALID_CSV = `observation_id,route_id,route_label,operator_label_if_public,direction,point_sequence,point_type,public_landmark,latitude,longitude,observed_at_local,observation_method,observer_code,second_confirmation,observed_fare_soles,fare_evidence,source_url,notes,verification_status
TEST_OBS_01,TEST_R10,Línea 10,Empresa Modelo,Ida,1,boarding,Parque Principal,-6.7715,-79.8400,2026-11-01T08:00:00,direct-travel,TEST_OBSERVER_1,TEST_CONFIRMER,2.00,ticket,,Observación matutina,verified
TEST_OBS_01,TEST_R10,Línea 10,Empresa Modelo,Ida,2,intermediate,Mercado Central,-6.7730,-79.8410,2026-11-01T08:05:00,direct-travel,TEST_OBSERVER_1,TEST_CONFIRMER,2.00,ticket,,Punto intermedio,verified
TEST_OBS_01,TEST_R10,Línea 10,Empresa Modelo,Ida,3,alighting,Hospital Las Mercedes,-6.7760,-79.8430,2026-11-01T08:12:00,direct-travel,TEST_OBSERVER_1,TEST_CONFIRMER,2.00,ticket,,Descenso verificado,verified`;

  it('parsea CSV estructurado correctamente', () => {
    const rows = parseCsv(TEST_VALID_CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0]!['route_label']).toBe('Línea 10');
    expect(rows[1]!['public_landmark']).toBe('Mercado Central');
    expect(rows[2]!['point_sequence']).toBe('3');
  });

  it('agrupa por observation_id y genera ruta, paraderos y segmentos enlazados', () => {
    const result = importFromCsv(TEST_VALID_CSV, 'chiclayo');
    expect(result.errors).toHaveLength(0);
    expect(result.rowCount).toBe(3);

    // 1 ruta
    expect(result.catalog.routes).toHaveLength(1);
    const route = result.catalog.routes[0]!;
    expect(route.id).toBe('TEST_R10');
    expect(route.label).toBe('Línea 10');
    expect(route.cityId).toBe('chiclayo');
    expect(route.status).toBe('verified');

    // 3 paraderos únicos
    expect(result.catalog.stops).toHaveLength(3);
    expect(result.catalog.stops[0]!.publicName).toBe('Parque Principal');
    expect(result.catalog.stops[2]!.publicName).toBe('Hospital Las Mercedes');

    // 2 segmentos consecutivos
    expect(result.catalog.segments).toHaveLength(2);
    const seg1 = result.catalog.segments[0]!;
    const seg2 = result.catalog.segments[1]!;

    expect(seg1.fare).toBe(2.0);
    expect(seg1.fareUnit).toBe('S/');
    expect(seg1.status).toBe('verified');
    expect(seg1.boardingNote).toContain('Parque Principal');
    expect(seg2.alightingNote).toContain('Hospital Las Mercedes');
  });

  it('rechaza observaciones sin verification_status="verified"', () => {
    const TEST_UNVERIFIED_CSV = `observation_id,route_id,route_label,operator_label_if_public,direction,point_sequence,point_type,public_landmark,latitude,longitude,observed_at_local,observation_method,observer_code,second_confirmation,observed_fare_soles,fare_evidence,source_url,notes,verification_status
TEST_OBS_UNV,TEST_R99,Línea 99,,Ida,1,boarding,Paradero X,-6.7715,-79.8400,2026-11-01T08:00:00,rumor,TEST_OBS,,,,,,unverified`;

    const result = importFromCsv(TEST_UNVERIFIED_CSV);
    expect(result.catalog.routes).toHaveLength(0);
    expect(result.catalog.segments).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('unverified');
  });

  it('rechaza observaciones sin observer_code (sin procedencia)', () => {
    const TEST_NO_OBSERVER_CSV = `observation_id,route_id,route_label,operator_label_if_public,direction,point_sequence,point_type,public_landmark,latitude,longitude,observed_at_local,observation_method,observer_code,second_confirmation,observed_fare_soles,fare_evidence,source_url,notes,verification_status
TEST_OBS_NO_CODE,TEST_R88,Línea 88,,Ida,1,boarding,Paradero Y,-6.7715,-79.8400,2026-11-01T08:00:00,direct,,,,,,,verified`;

    const result = importFromCsv(TEST_NO_OBSERVER_CSV);
    expect(result.catalog.routes).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('observer_code');
  });

  it('maneja CSV vacío devolviendo catálogo vacío válido', () => {
    const result = importFromCsv('');
    expect(result.catalog.routes).toHaveLength(0);
    expect(result.rowCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
