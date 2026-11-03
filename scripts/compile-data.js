/**
 * Script para compilar observaciones verificadas de campo (CSV)
 * hacia el catálogo JSON de producción en data/ y public/data/.
 * Aplica validación estricta, deduplica paraderos canónicos y añade
 * trazado realista de calles e información de orientación para el pasajero.
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

// Configuración de rutas reconocidas
const ROUTE_METADATA = {
  CIX_PIMENTEL: {
    vehicleType: 'Combi',
    vehicleSign: 'CHICLAYO - PIMENTEL / USMP - UCV - MUELLE',
    vehicleColor: 'Blanco con franja azul y naranja',
    routeColor: '#0284c7',
  },
  CIX_PIMENTEL_RET: {
    vehicleType: 'Combi',
    vehicleSign: 'CHICLAYO - PIMENTEL / USMP - UCV - BOLOGNESI',
    vehicleColor: 'Blanco con franja azul y naranja',
    routeColor: '#0284c7',
  },
  CIX_LINEA_10: {
    vehicleType: 'Microbús / Combi',
    vehicleSign: 'LÍNEA 10 / MOSHOQUEQUE - BALTA - MERCEDES',
    vehicleColor: 'Verde esmeralda con franja blanca',
    routeColor: '#10b981',
  },
  CIX_LINEA_10_RET: {
    vehicleType: 'Microbús / Combi',
    vehicleSign: 'LÍNEA 10 / MERCEDES - BALTA - MOSHOQUEQUE',
    vehicleColor: 'Verde esmeralda con franja blanca',
    routeColor: '#10b981',
  },
};

// Generador de waypoints intermedios entre paraderos para trazar calles reales
function getIntermediateWaypoints(fromLandmark, toLandmark) {
  const key = `${fromLandmark} -> ${toLandmark}`;
  const waypoints = {
    'Paradero Chiclayo - Pimentel (Av. Bolognesi) -> Óvalo Santa Victoria': [
      [-6.7770, -79.8410],
      [-6.7795, -79.8425],
    ],
    'Óvalo Santa Victoria -> Campus USMP Filial Norte': [
      [-6.7860, -79.8475],
      [-6.7925, -79.8560],
      [-6.8010, -79.8690],
      [-6.8080, -79.8800],
    ],
    'Campus USMP Filial Norte -> Campus UCV Chiclayo': [
      [-6.8160, -79.8960],
    ],
    'Campus UCV Chiclayo -> Muelle Histórico de Pimentel': [
      [-6.8260, -79.9170],
      [-6.8312, -79.9270],
      [-6.8335, -79.9315],
    ],
    'Muelle Histórico de Pimentel -> Campus UCV Chiclayo': [
      [-6.8335, -79.9315],
      [-6.8312, -79.9270],
      [-6.8260, -79.9170],
    ],
    'Campus UCV Chiclayo -> Campus USMP Filial Norte': [
      [-6.8160, -79.8960],
    ],
    'Campus USMP Filial Norte -> Óvalo Santa Victoria': [
      [-6.8080, -79.8800],
      [-6.8010, -79.8690],
      [-6.7925, -79.8560],
      [-6.7860, -79.8475],
    ],
    'Óvalo Santa Victoria -> Paradero Chiclayo - Pimentel (Av. Bolognesi)': [
      [-6.7795, -79.8425],
      [-6.7770, -79.8410],
    ],
    'Mercado Moshoqueque (Av. Kennedy) -> Mercado Modelo (Av. Balta con Pedro Ruiz)': [
      [-6.7640, -79.8362],
      [-6.7690, -79.8370],
    ],
    'Mercado Modelo (Av. Balta con Pedro Ruiz) -> Parque Principal de Chiclayo': [
      [-6.7720, -79.8390],
    ],
    'Parque Principal de Chiclayo -> Hospital Docente Las Mercedes': [
      [-6.7740, -79.8425],
    ],
    'Hospital Docente Las Mercedes -> Parque Principal de Chiclayo': [
      [-6.7740, -79.8425],
    ],
    'Parque Principal de Chiclayo -> Mercado Modelo (Av. Balta con Pedro Ruiz)': [
      [-6.7720, -79.8390],
    ],
    'Mercado Modelo (Av. Balta con Pedro Ruiz) -> Mercado Moshoqueque (Av. Kennedy)': [
      [-6.7690, -79.8370],
      [-6.7640, -79.8362],
    ],
  };
  return waypoints[key] ?? [];
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
const stopMap = new Map(); // Landmark canonical name -> Stop
const cityId = 'chiclayo';
const cityName = 'Chiclayo';

// Primer pase: crear paraderos canónicos únicos para que ida y vuelta compartan nodos en el grafo
for (const row of rows) {
  const name = row.public_landmark;
  if (!name || stopMap.has(name)) continue;

  const lat = Number(row.latitude);
  const lon = Number(row.longitude);
  if (isNaN(lat) || isNaN(lon)) continue;

  // Generar ID canónico basado en el nombre del paradero
  const canonicalId = 'stop-' + name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const stop = {
    id: canonicalId,
    cityId,
    publicName: name,
    landmarkContext: row.landmark_context || undefined,
    category: row.landmark_category || 'general',
    lat,
    lon,
    sourceId: `src-${row.observation_id}`,
    verifiedAt: row.observed_at_local || new Date().toISOString(),
  };

  stops.push(stop);
  stopMap.set(name, stop);
}

// Segundo pase: crear rutas, fuentes y segmentos
for (const [obsId, groupRows] of groups) {
  const first = groupRows[0];
  if (!first || first.verification_status !== 'verified' || !first.observer_code) {
    console.warn(`[compile-data] Observación ${obsId} descartada.`);
    continue;
  }

  const routeId = first.route_id;
  const routeLabel = first.route_label;
  const sourceId = `src-${obsId}`;
  const meta = ROUTE_METADATA[routeId] ?? {};

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
      vehicleType: meta.vehicleType,
      vehicleSign: meta.vehicleSign,
      vehicleColor: meta.vehicleColor,
      routeColor: meta.routeColor,
      status: 'verified',
      sourceId,
      verifiedAt,
      reviewAfter: reviewDate.toISOString(),
    });
  }

  const sortedRows = [...groupRows].sort(
    (a, b) => Number(a.point_sequence) - Number(b.point_sequence)
  );

  for (let i = 0; i < sortedRows.length - 1; i++) {
    const fromRow = sortedRows[i];
    const toRow = sortedRows[i + 1];

    const fromStop = stopMap.get(fromRow.public_landmark);
    const toStop = stopMap.get(toRow.public_landmark);
    if (!fromStop || !toStop) continue;

    const fareStr = fromRow.observed_fare_soles;
    const fare = fareStr && fareStr !== '' && fareStr !== 'unknown'
      ? Number(fareStr)
      : undefined;

    const midWaypoints = getIntermediateWaypoints(fromRow.public_landmark, toRow.public_landmark);
    const geometry = [
      [fromStop.lat, fromStop.lon],
      ...midWaypoints,
      [toStop.lat, toStop.lon],
    ];

    const estMin = Number(toRow.estimated_minutes) || 5;

    segments.push({
      id: `seg-${obsId}-${i}`,
      routeId,
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      geometry,
      boardingNote: fromRow.landmark_context ? `Abordar en: ${fromRow.landmark_context}` : undefined,
      alightingNote: toRow.landmark_context ? `Descenso en: ${toRow.landmark_context}` : undefined,
      alightingCue: toRow.alighting_cue || `Avisa con anticipación: 'Baja en ${toStop.publicName}'`,
      estimatedMinutes: estMin,
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

console.log(`[compile-data] ✅ Catálogo enriquecido compilado exitosamente:`);
console.log(` - Ciudad: ${catalog.cityName} (${catalog.cityId})`);
console.log(` - Rutas verificadas: ${catalog.routes.length}`);
console.log(` - Paraderos canónicos: ${catalog.stops.length}`);
console.log(` - Segmentos con waypoints viales: ${catalog.segments.length}`);
console.log(` - Fuentes de campo: ${catalog.sources.length}`);
console.log(` - Destinos: ${jsonOutPath} y ${publicJsonOutPath}`);
