# Tareas: Mapa móvil y modo sin conexión

## Tareas

- [x] 1. Crear `src/map/MapProvider.ts` con adaptador de proveedor de tiles (OSM ODbL).
- [x] 2. Crear `src/map/attribution.ts` con textos de atribución requeridos.
- [x] 3. Crear `src/map/MapView.tsx` con Leaflet/react-leaflet (lazy load y renderizado de paraderos y geometría).
- [x] 4. Crear `src/pwa/cache.ts` con caché del catálogo en localStorage y marcas de fecha de sincronización.
- [x] 5. Crear `src/pwa/offline.ts` con detección de estado de conexión.
- [x] 6. Configurar `vite-plugin-pwa` en `vite.config.ts` con manifest y service worker de runtime caching.
- [x] 7. Crear `src/pwa/registerSW.ts` con registro del service worker.
- [x] 8. Crear prueba de uso sin conexión en `src/pwa/cache.test.ts` (catálogo cacheado funciona, fecha de sync visible).
- [x] 9. Ejecutar prueba y verificar resultado (100% aprobada).
