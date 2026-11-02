# Diseño: Catálogo de recorridos verificados, modelo por ciudad y estado vacío

## Arquitectura del Módulo

```
src/catalog/
├── types.ts        # Tipos del modelo de datos (Route, Stop, Segment, Source, LiveReport, Catalog, CityConfig)
├── config.ts       # Configuración central (ciudades, límites de coordenadas, vigencia, caducidad)
├── validator.ts    # Validador de esquemas, procedencia, referencias y coordenadas
├── importer.ts     # Parser e importador de CSV de campo a catálogo
└── catalog.ts      # Consultas, filtrado por vigencia y utilidades de acceso
```

## Modelo de Datos (`types.ts`)

```typescript
export type SegmentStatus = 'verified' | 'aging' | 'unverified' | 'retired';

export type SourceType =
  | 'field-observation'
  | 'document'
  | 'community-report'
  | 'osm';

export type ReportKind =
  | 'unit-passed'
  | 'unit-absent'
  | 'stop-changed'
  | 'other';

export interface CityConfig {
  id: string;               // Identificador único (ej: 'chiclayo')
  name: string;             // Nombre para mostrar (ej: 'Chiclayo')
  country: string;          // País (ej: 'Perú')
  boundingCenter: [number, number]; // [lat, lon] centro de vista
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  pilotStatus: 'active-pilot' | 'planned' | 'unsupported';
}

export interface Route {
  id: string;
  cityId: string;           // Ciudad asociada
  label: string;            // Etiqueta pública reconocible (ej: 'Línea 10', 'Combi Pimentel')
  direction?: string;       // Sentido de marcha
  operatorName?: string;    // Nombre público si se observó
  status: SegmentStatus;
  sourceId: string;
  verifiedAt: string;       // ISO 8601
  reviewAfter: string;      // ISO 8601 — fecha límite antes de pasar a 'aging'
}

export interface Stop {
  id: string;
  cityId: string;           // Ciudad asociada
  publicName: string;       // Nombre o landmark público
  lat: number;
  lon: number;
  sourceId: string;
  verifiedAt: string;       // ISO 8601
}

export interface Segment {
  id: string;
  routeId: string;
  fromStopId: string;
  toStopId: string;
  geometry?: [number, number][]; // Coordenadas del recorrido verificado
  boardingNote?: string;
  alightingNote?: string;
  fare?: number;                 // Tarifa observada (opcional)
  fareUnit?: string;             // ej: 'S/'
  sourceId: string;
  evidenceMethod: string;
  status: SegmentStatus;
  observedAt: string;            // ISO 8601
}

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  license?: string;
  observedAt: string;
  notes?: string;
}

export interface LiveReport {
  id: string;
  routeId: string;
  stopId?: string;
  kind: ReportKind;
  createdAt: string;
  expiresAt: string;
  countBucket: number;
}

export interface Catalog {
  schemaVersion: number;
  cityId: string;
  cityName: string;
  lastUpdated: string | null;
  routes: Route[];
  stops: Stop[];
  segments: Segment[];
  sources: Source[];
}
```

## Configuración Central (`config.ts`)

```typescript
export const CHICLAYO_CITY_CONFIG: CityConfig = {
  id: 'chiclayo',
  name: 'Chiclayo',
  country: 'Perú',
  boundingCenter: [-6.7715, -79.8400],
  bounds: {
    minLat: -7.0,
    maxLat: -6.5,
    minLon: -80.0,
    maxLon: -79.2,
  },
  pilotStatus: 'active-pilot',
};

export const CATALOG_CONFIG = {
  reviewWindowDays: 30,      // Días tras los cuales un segmento verificado pasa a 'aging'
  reportExpiryMinutes: 20,   // Caducidad de reportes de pasajeros
  maxReportsPerBucket: 10,  // Límite de reportes por ruta por bucket (5 min)
  rateLimitBucketMinutes: 5,
} as const;
```

## Lógica del Validador (`validator.ts`)

- `isValidCoordinate(lat, lon, cityConfig?)`: Valida contra los límites de la ciudad especificada (por defecto Chiclayo).
- `validateRoute(route)`: Requiere id, cityId, label, status válido, sourceId, verifiedAt y reviewAfter en formato de fecha válido.
- `validateStop(stop, cityConfig?)`: Requiere id, cityId, publicName, coordenadas dentro de los límites de la ciudad, sourceId y verifiedAt.
- `validateSegment(segment)`: Requiere id, routeId, fromStopId, toStopId, sourceId, evidenceMethod, status y observedAt. Si fare existe, debe ser un número >= 0.
- `validateCatalog(raw, cityConfig?)`: Verifica la integridad referencial cruzada (todo sourceId, stopId y routeId referenciado debe existir en el catálogo). Descarta entradas rotas y acumula errores legibles.

## Importador de Observaciones (`importer.ts`)

- Agrupa filas del CSV por `observation_id`.
- Filtra filas con `verification_status !== 'verified'` o sin `observer_code`.
- Asocia automáticamente los registros a la ciudad activa (`cityId: 'chiclayo'`).
- Convierte landmarks a paraderos (`Stop`), calculando `reviewAfter` a partir de `observed_at_local` y `CATALOG_CONFIG.reviewWindowDays`.
- Enlaza puntos consecutivos formando segmentos (`Segment`) con su geometría y notas de abordaje/descenso.

## Ciclo de Vida y Filtrado (`catalog.ts`)

- `isCatalogEmpty(catalog)`: Determina si el catálogo no contiene rutas ni segmentos.
- `getEffectiveStatus(segment, route, now)`: Evalúa si un segmento `verified` superó su `reviewAfter`; de ser así, lo recategoriza como `aging`.
- `getEligibleSegments(catalog, now)`: Devuelve solo segmentos en estado `verified` con fecha de revisión vigente.
