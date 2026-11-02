# Tareas: Catálogo de recorridos verificados, modelo por ciudad y estado vacío

## Tareas

- [x] 1. Definir tipos en `src/catalog/types.ts` incluyendo `CityConfig`, `Route`, `Stop`, `Segment`, `Source`, `LiveReport`, y `Catalog` con soporte explícito de `cityId`.
- [x] 2. Configurar `src/catalog/config.ts` con configuración desacoplada de ciudad (`CHICLAYO_CITY_CONFIG`, límites de coordenadas, ventana de 30 días, caducidad de 20 min).
- [x] 3. Implementar y actualizar `src/catalog/validator.ts` con validación de esquemas, límites por ciudad, fechas ISO y referencias cruzadas.
- [x] 4. Implementar y actualizar `src/catalog/importer.ts` con parsing de CSV, agrupación por `observation_id`, secuenciación y asociación de ciudad.
- [x] 5. Implementar y actualizar `src/catalog/catalog.ts` con manejo de catálogo vacío, cálculo de estado efectivo (`aging`), filtrado de elegibles y consultas.
- [x] 6. Implementar pruebas unitarias completas con fixtures `TEST_` en `src/catalog/validator.test.ts`, `src/catalog/importer.test.ts` y `src/catalog/catalog.test.ts`.
- [x] 7. Ejecutar suite de pruebas con Vitest y verificar aprobación al 100%.
