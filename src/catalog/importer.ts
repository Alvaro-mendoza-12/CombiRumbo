/**
 * Importador de observaciones de campo desde CSV.
 * Lee data/observaciones-recorrido.csv, agrupa por observation_id y valida campos.
 * Solo datos con verification_status 'verified' se incorporan al catálogo.
 * Asocia explícitamente cada recorrido y paradero a la ciudad piloto (Chiclayo).
 */

import type { Catalog, Route, Segment, Source, Stop } from './types';
import { computeReviewAfter, DEFAULT_CITY_ID, getCityConfig } from './config';
import { EMPTY_CATALOG } from './types';

/** Fila del CSV de observaciones. */
export interface ObservationRow {
  observation_id: string;
  route_id: string;
  route_label: string;
  operator_label_if_public: string;
  direction: string;
  point_sequence: number;
  point_type: string;
  public_landmark: string;
  latitude: number;
  longitude: number;
  observed_at_local: string;
  observation_method: string;
  observer_code: string;
  second_confirmation: string;
  observed_fare_soles: string;
  fare_evidence: string;
  source_url: string;
  notes: string;
  verification_status: string;
}

export interface ImportResult {
  catalog: Catalog;
  errors: string[];
  rowCount: number;
}

/** Parsea texto CSV simple (sin comillas escapadas complejas). */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  if (!firstLine) return [];
  const headers = firstLine.split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(',');
    if (values.length < headers.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (!header) continue;
      row[header] = (values[j] ?? '').trim();
    }
    rows.push(row);
  }

  return rows;
}

function toNumber(val: string | undefined): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

/**
 * Importa observaciones desde texto CSV y construye un catálogo para la ciudad especificada.
 * Solo filas con verification_status = 'verified' se incorporan.
 * Registros sin observer_code o sin public_landmark se rechazan.
 */
export function importFromCsv(csvText: string, cityId: string = DEFAULT_CITY_ID): ImportResult {
  const errors: string[] = [];
  const rows = parseCsv(csvText);
  const cityConfig = getCityConfig(cityId);

  if (rows.length === 0) {
    return {
      catalog: {
        ...EMPTY_CATALOG,
        cityId,
        cityName: cityConfig.name,
      },
      errors: [],
      rowCount: 0,
    };
  }

  // Agrupar por observation_id
  const groups = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const id = row.observation_id;
    if (!id) {
      errors.push('Fila sin observation_id descartada.');
      continue;
    }
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(row);
  }

  const routes: Route[] = [];
  const stops: Stop[] = [];
  const segments: Segment[] = [];
  const sources: Source[] = [];
  const stopMap = new Map<string, Stop>();

  for (const [obsId, groupRows] of groups) {
    const first = groupRows[0];
    if (!first) continue;

    // Solo importar observaciones verificadas
    if (first.verification_status !== 'verified') {
      errors.push(`Observación ${obsId} no importada: verification_status="${first.verification_status}".`);
      continue;
    }

    if (!first.observer_code) {
      errors.push(`Observación ${obsId} rechazada: sin observer_code (procedencia).`);
      continue;
    }

    const routeId = first.route_id;
    const routeLabel = first.route_label;
    if (!routeId || !routeLabel) {
      errors.push(`Observación ${obsId} rechazada: sin route_id o route_label.`);
      continue;
    }

    // Crear fuente para esta observación
    const sourceId = `src-${obsId}`;
    sources.push({
      id: sourceId,
      type: 'field-observation',
      title: `Observación de campo ${obsId}`,
      url: first.source_url || undefined,
      license: undefined,
      observedAt: first.observed_at_local || new Date().toISOString(),
      notes: first.notes || `Método: ${first.observation_method}; observador: ${first.observer_code}; segunda confirmación: ${first.second_confirmation || 'no'}`,
    });

    // Crear ruta
    if (!routes.find(r => r.id === routeId)) {
      const verifiedAt = first.observed_at_local || new Date().toISOString();
      routes.push({
        id: routeId,
        cityId,
        label: routeLabel,
        direction: first.direction || undefined,
        operatorName: first.operator_label_if_public || undefined,
        status: 'verified',
        sourceId,
        verifiedAt,
        reviewAfter: computeReviewAfter(verifiedAt),
      });
    }

    // Ordenar puntos por secuencia
    const sortedRows = [...groupRows].sort(
      (a, b) => Number(a.point_sequence) - Number(b.point_sequence)
    );

    // Crear stops a partir de landmarks
    for (const row of sortedRows) {
      if (!row.public_landmark) {
        errors.push(`Punto en ${obsId} descartado: sin public_landmark.`);
        continue;
      }
      const lat = toNumber(row.latitude);
      const lon = toNumber(row.longitude);
      if (lat === undefined || lon === undefined) {
        errors.push(`Punto en ${obsId} descartado: coordenadas inválidas.`);
        continue;
      }
      const stopId = `stop-${obsId}-${row.point_sequence}`;
      if (!stopMap.has(stopId)) {
        const verifiedAt = row.observed_at_local || first.observed_at_local || new Date().toISOString();
        const stop: Stop = {
          id: stopId,
          cityId,
          publicName: row.public_landmark,
          lat,
          lon,
          sourceId,
          verifiedAt,
        };
        stops.push(stop);
        stopMap.set(stopId, stop);
      }
    }

    // Crear segmentos entre puntos consecutivos
    const stopIds = sortedRows
      .filter(r => r.public_landmark && toNumber(r.latitude) !== undefined)
      .map(r => `stop-${obsId}-${r.point_sequence}`);

    for (let i = 0; i < stopIds.length - 1; i++) {
      const fromId = stopIds[i]!;
      const toId = stopIds[i + 1]!;
      const fromRow = sortedRows[i]!;
      const toRow = sortedRows[i + 1]!;

      // Tarifa: solo si hay evidencia
      const fareStr = fromRow.observed_fare_soles;
      const fare = fareStr && fareStr !== '' && fareStr !== 'unknown'
        ? toNumber(fareStr)
        : undefined;

      const fromLat = toNumber(fromRow.latitude) ?? 0;
      const fromLon = toNumber(fromRow.longitude) ?? 0;
      const toLat = toNumber(toRow.latitude) ?? 0;
      const toLon = toNumber(toRow.longitude) ?? 0;

      const geometry: [number, number][] = [
        [fromLat, fromLon],
        [toLat, toLon],
      ];

      segments.push({
        id: `seg-${obsId}-${i}`,
        routeId,
        fromStopId: fromId,
        toStopId: toId,
        geometry,
        boardingNote: i === 0 ? `Sube en ${fromRow.public_landmark}` : undefined,
        alightingNote: i === stopIds.length - 2 ? `Baja en ${toRow.public_landmark}` : undefined,
        fare: fare !== undefined ? fare : undefined,
        fareUnit: fare !== undefined ? 'S/' : undefined,
        sourceId,
        evidenceMethod: first.observation_method || 'field-observation',
        status: 'verified',
        observedAt: first.observed_at_local || new Date().toISOString(),
      });
    }
  }

  return {
    catalog: {
      schemaVersion: 1,
      cityId,
      cityName: cityConfig.name,
      lastUpdated: new Date().toISOString(),
      routes,
      stops,
      segments,
      sources,
    },
    errors,
    rowCount: rows.length,
  };
}
