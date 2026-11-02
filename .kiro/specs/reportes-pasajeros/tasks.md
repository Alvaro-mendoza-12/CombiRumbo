# Tareas: Reportes de pasajeros

## Tareas

- [x] 1. Crear `src/catalog/types.ts` con tipos de LiveReport y categorías de reporte.
- [x] 2. Crear `src/reports/store.ts` con almacenamiento local en localStorage sin rastreo ni identificación personal.
- [x] 3. Crear `src/reports/expiry.ts` con lógica de caducidad automática de 20 minutos y limpieza.
- [x] 4. Crear protección contra spam / rate-limiting (máximo 10 por bucket de 5 minutos por ruta).
- [x] 5. Crear `src/reports/ReportsView.tsx` con formulario de envío manual y visualización con etiquetas explícitas.
- [x] 6. Integrar reportes en la vista de resultados (fila separada del recorrido verificado, sin confundir con telemetría ni GPS).
- [x] 7. Deshabilitar envío de reportes en modo offline.
- [x] 8. Crear prueba unitaria de reporte vencido y rate-limit en `src/reports/store.test.ts`.
- [x] 9. Ejecutar prueba y verificar resultado (100% aprobada).
