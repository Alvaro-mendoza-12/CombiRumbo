# Diseño: Mapa móvil y modo sin conexión

## Arquitectura

```
src/map/
├── MapProvider.ts    # Adaptador para proveedor de tiles
├── MapView.tsx        # Componente de mapa con Leaflet
└── attribution.ts     # Textos de atribución y licencia

src/pwa/
├── cache.ts           # Caché del catálogo en localStorage/IndexedDB
├── offline.ts         # Detección de estado de conexión
└── registerSW.ts      # Registro del service worker (vite-plugin-pwa)
```

## Mapa (MapView.tsx)

- Usa Leaflet 1.9.4 + react-leaflet 5.0.0.
- Dibuja stops como marcadores y geometry como polyline.
- Atribución visible en la esquina del mapa.
- No dibuja ubicación de vehículos.
- El componente se carga de forma perezosa (lazy) para no penalizar la primera carga.

## Adaptador de proveedor (MapProvider.ts)

```typescript
interface TileProvider {
  url: string;
  attribution: string;
  maxZoom: number;
}

const OSM_PROVIDER: TileProvider = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
};
```

- Se puede cambiar el proveedor sin tocar MapView.
- OSM cumple condiciones de licencia con atribución.

## Caché del catálogo (cache.ts)

- Guarda el catálogo en `localStorage` con marca de fecha de sincronización.
- `saveCatalog(catalog)`: guarda con timestamp.
- `loadCachedCatalog()`: devuelve catálogo guardado + fecha de sincronización.
- `getCachedSyncDate()`: devuelve la fecha del último guardado.
- No guarda ubicación del usuario ni historial de viajes.

## Detección offline (offline.ts)

- `isOnline()`: usa `navigator.onLine`.
- Event listeners para `online`/`offline`.
- En offline: usa catálogo cacheado, deshabilita reportes en vivo.
- Muestra fecha de sincronización del catálogo cacheado.
- No falsea la fecha como recién actualizada.

## Service worker (registerSW.ts)

- Usa `vite-plugin-pwa` para generar el service worker.
- Precachea el shell de la app y el catálogo.
- Estrategia: stale-while-revalidate para el catálogo, cache-first para assets estáticos.

## Decisiones
- El mapa se carga de forma perezosa; la instrucción de viaje se muestra primero.
- OSM es la opción inicial por ser gratuita y con licencia abierta (ODbL) con atribución.
- No se usan APIs de mapas pagadas ni claves en el navegador.
- La caché no incluye reportes en vivo; estos expiran y no se muestran offline.
