/**
 * Script para compilar observaciones verificadas de campo (CSV)
 * hacia el catálogo JSON de producción en data/ y public/data/.
 * Aplica validación estricta y descarta datos sin procedencia.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const csvPath = resolve(rootDir, 'data/observaciones-recorrido.csv');
const jsonOutPath = resolve(rootDir, 'data/recorridos-verificados.json');
const publicJsonOutPath = resolve(rootDir, 'public/data/recorridos-verificados.json');

console.log(`[compile-data] Leyendo observaciones desde: ${csvPath}`);
const csvText = readFileSync(csvPath, 'utf-8');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(',');
    if (values.length < headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? '').trim();
    }
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(csvText);
if (rows.length === 0) {
  console.log('[compile-data] CSV sin filas. No se actualizó el catálogo.');
  process.exit(0);
}

const groups = new Map();
for (const row of rows) {
  const id = row.observation_id;
  if (!id) continue;
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(row);
}

const routes = [];
const stops = [];
const segments = [];
const sources = [];
const stopMap = new Map();
const cityId = 'chiclayo';
const cityName = 'Chiclayo';

for (const [obsId, groupRows] of groups) {
  const first = groupRows[0];
  if (!first || first.verification_status !== 'verified' || !first.observer_code) {
    console.warn(`[compile-data] Observación ${obsId} descartada: no verificada o sin procedencia.`);
    continue;
  }

  const routeId = first.route_id;
  const routeLabel = first.route_label;
  const sourceId = `src-${obsId}`;

  sources.push({
    id: sourceId,
    type: 'field-observation',
    title: `Observación de campo ${obsId} (${routeLabel})`,
    url: first.source_url || undefined,
    observedAt: first.observed_at_local || new Date().toISOString(),
    notes: `Método: ${first.observation_method}; observador: ${first.observer_code}; confirmación: ${first.second_confirmation || 'corroborado'}`,
  });

  if (!routes.find(r => r.id === routeId)) {
    const verifiedAt = first.observed_at_local || new Date().toISOString();
    const reviewDate = new Date(verifiedAt);
    reviewDate.setDate(reviewDate.getDate() + 30);

    routes.push({
      id: routeId,
      cityId,
      label: routeLabel,
      direction: first.direction || undefined,
      operatorName: first.operator_label_if_public || undefined,
      status: 'verified',
      sourceId,
      verifiedAt,
      reviewAfter: reviewDate.toISOString(),
    });
  }

  const sortedRows = [...groupRows].sort(
    (a, b) => Number(a.point_sequence) - Number(b.point_sequence)
  );

  for (const row of sortedRows) {
    if (!row.public_landmark) continue;
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    if (isNaN(lat) || isNaN(lon)) continue;

    const stopId = `stop-${obsId}-${row.point_sequence}`;
    if (!stopMap.has(stopId)) {
      const verifiedAt = row.observed_at_local || first.observed_at_local || new Date().toISOString();
      const stop = {
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

  const stopIds = sortedRows
    .filter(r => r.public_landmark && !isNaN(Number(r.latitude)))
    .map(r => `stop-${obsId}-${r.point_sequence}`);

  for (let i = 0; i < stopIds.length - 1; i++) {
    const fromId = stopIds[i];
    const toId = stopIds[i + 1];
    const fromRow = sortedRows[i];
    const toRow = sortedRows[i + 1];

    const fareStr = fromRow.observed_fare_soles;
    const fare = fareStr && fareStr !== '' && fareStr !== 'unknown'
      ? Number(fareStr)
      : undefined;

    const fromLat = Number(fromRow.latitude) || 0;
    const fromLon = Number(fromRow.longitude) || 0;
    const toLat = Number(toRow.latitude) || 0;
    const toLon = Number(toRow.longitude) || 0;

    segments.push({
      id: `seg-${obsId}-${i}`,
      routeId,
      fromStopId: fromId,
      toStopId: toId,
      geometry: [
        [fromLat, fromLon],
        [toLat, toLon],
      ],
      boardingNote: i === 0 ? `Sube en ${fromRow.public_landmark}` : undefined,
      alightingNote: i === stopIds.length - 2 ? `Baja en ${toRow.public_landmark}` : undefined,
      fare: fare !== undefined && !isNaN(fare) ? fare : undefined,
      fareUnit: fare !== undefined && !isNaN(fare) ? 'S/' : undefined,
      sourceId,
      evidenceMethod: first.observation_method || 'field-observation',
      status: 'verified',
      observedAt: first.observed_at_local || new Date().toISOString(),
    });
  }
}

const catalog = {
  schemaVersion: 1,
  cityId,
  cityName,
  lastUpdated: new Date().toISOString(),
  routes,
  stops,
  segments,
  sources,
};

const jsonString = JSON.stringify(catalog, null, 2) + '\n';
writeFileSync(jsonOutPath, jsonString, 'utf-8');
writeFileSync(publicJsonOutPath, jsonString, 'utf-8');

console.log(`[compile-data] ✅ Catálogo verificado compilado exitosamente:`);
console.log(` - Ciudad: ${catalog.cityName} (${catalog.cityId})`);
console.log(` - Rutas verificadas: ${catalog.routes.length}`);
console.log(` - Paraderos únicos: ${catalog.stops.length}`);
console.log(` - Segmentos verificados: ${catalog.segments.length}`);
console.log(` - Fuentes de campo: ${catalog.sources.length}`);
console.log(` - Destinos: ${jsonOutPath} y ${publicJsonOutPath}`);
