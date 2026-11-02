# Diseño: Búsqueda de viaje

## Arquitectura

```
src/routing/
├── graph.ts        # Construcción del grafo de paraderos y segmentos
├── eligibility.ts  # Filtros de validez de segmentos
├── router.ts       # Cálculo de itinerarios (camino mínimo por transbordos)
└── format.ts       # Formateo de itinerarios a instrucciones legibles

src/search/
├── SearchView.tsx       # Pantalla de búsqueda (origen, destino, botón)
├── ResultsView.tsx      # Lista de resultados con tarjetas
├── DetailView.tsx       # Detalle de un itinerario con pasos y fuentes
├── geolocation.ts       # Geolocalización opcional local
└── searchModel.ts       # Estado de búsqueda y resultados
```

## Grafo de transporte (graph.ts)

- Nodos: stops del catálogo.
- Aristas: segments elegibles (verified y dentro de reviewAfter).
- Peso de arista: 1 transbordo + distancia de caminata estimada entre conexión.
- Búsqueda: BFS por niveles (menos transbordos primero) o Dijkstra con peso compuesto.

## Elegibilidad (eligibility.ts)

```typescript
function isEligible(segment: Segment, catalog: Catalog, now: Date): boolean {
  if (segment.status !== 'verified') return false;
  const route = catalog.routes.find(r => r.id === segment.routeId);
  if (!route || route.status !== 'verified') return false;
  if (new Date(route.reviewAfter) < now) return false;
  return true;
}
```

## Router (router.ts)

- Entrada: catálogo, stopOrigen, stopDestino.
- Construye grafo con segments elegibles.
- Encuentra caminos del origen al destino.
- Ordena por: 1) menos transbordos, 2) menos caminata estimada.
- Devuelve array de `Itinerary` con segments, stops y caminatas de conexión.

## Itinerario formateado (format.ts)

```typescript
interface ItineraryStep {
  type: 'walk' | 'ride';
  label: string;          // "Camina a..." o "Toma [línea]"
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
}

interface Itinerary {
  id: string;
  steps: ItineraryStep[];
  totalTransfers: number;
  estimatedWalkMeters: number;
  orderingCriteria: string;  // "Menos transbordos"
  verificationDate: string;
  fare: { amount: number | null; unit: string; confirmed: boolean };
}
```

## Geolocalización (geolocation.ts)

- `requestOriginLocation()`: usa navigator.geolocation solo al tocar el botón.
- Procesa coordenadas localmente para buscar el stop más cercano.
- No guarda ni envía coordenadas.
- Si se deniega, permite entrada manual sin error.
- Si el catálogo está vacío, la ubicación no completa ningún campo.

## Estado de búsqueda (searchModel.ts)

- `originQuery`, `destinationQuery`: texto ingresado.
- `originStopId`, `destinationStopId`: stop seleccionado del catálogo.
- `results`: itinerarios calculados.
- `searchState`: 'idle' | 'searching' | 'results' | 'no-results' | 'empty-catalog'.
- `syncDate`: fecha de sincronización del catálogo.

## Decisiones
- El grafo se construye en memoria a partir del catálogo cargado.
- No se afirman tiempos de viaje; solo transbordos y caminata estimada.
- La caminata se estima con fórmula de Haversine entre stops de conexión.
- Si el catálogo está vacío, toda búsqueda devuelve el estado vacío.
