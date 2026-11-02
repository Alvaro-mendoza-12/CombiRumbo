# Spec: Catálogo de recorridos verificados, estado vacío e importación

## Requisitos

### Contexto
El catálogo `data/recorridos-verificados.json` inicia vacío de forma intencional hasta que se realicen observaciones directas de campo. La app debe funcionar con catálogo vacío como estado normal y válido, informando al usuario con total transparencia. 

Cada recorrido y paradero debe asociarse a una ciudad identificada (`cityId`), evitando codificar Chiclayo como un supuesto implícito u oculto en la lógica, pero estableciendo a Chiclayo como el **único piloto activo** de esta entrega. Cualquier otra ciudad sin datos verificados no debe simularse con datos ficticios, sino indicar claramente que aún no tiene cobertura. Cuando se aporten observaciones reales, el importador debe validarlas estrictamente e incorporarlas.

### Requisitos funcionales
- **RF-CAT-01 (Modelo por Ciudad):** Definir tipos TypeScript para `CityConfig`, `Route`, `Stop`, `Segment`, `Source`, `LiveReport` y `Catalog`. Cada `Route` y `Stop` se asocia a un `cityId`. El catálogo define su `cityId` y `cityName`.
- **RF-CAT-02 (Configuración de Ciudad Piloto):** Configurar Chiclayo como ciudad piloto activa con sus límites geográficos (-7.0 a -6.5 latitud, -80.0 a -79.2 longitud) y centro de referencia, desacoplado de la lógica de negocio para permitir futuras ciudades mediante configuración.
- **RF-CAT-03 (Carga y Validación Inicial):** Cargar el catálogo desde `data/recorridos-verificados.json` (o caché offline si no hay red) y validar su integridad estructural.
- **RF-CAT-04 (Validación Estricta de Integridad):** Rechazar o descartar registros que no cuenten con `sourceId`, sin `verifiedAt`, con coordenadas fuera del rango de la ciudad, con referencias rotas (`routeId`, `fromStopId`, `toStopId`) o con estados inválidos.
- **RF-CAT-05 (Estado Vacío Honesto):** Cuando el catálogo no tenga recorridos verificados o el destino no esté cubierto, mostrar un estado vacío claro y transparente: "Aún no tenemos una ruta verificada para este viaje" y explicar la cobertura piloto.
- **RF-CAT-06 (Importación desde CSV de Campo):** Importar observaciones desde `data/observaciones-recorrido.csv` agrupando puntos por `observation_id`, ordenando por `point_sequence`, exigiendo `observer_code` y `verification_status = 'verified'`.
- **RF-CAT-07 (Ciclo de Vida de Verificación):** Gestionar los 4 estados:
  - `verified`: verificado en campo dentro de su ventana de vigencia (`reviewAfter`);
  - `aging`: superó la ventana de vigencia (30 días por defecto); se advierte al pasajero;
  - `unverified`: sin confirmación suficiente, nunca participa en rutas sugeridas;
  - `retired`: fuera de servicio.
- **RF-CAT-08 (Trazabilidad y Procedencia):** Exponer para cada segmento su fuente (`Source`), fecha de observación (`observedAt`), método de evidencia (`evidenceMethod`) y fecha límite de revisión (`reviewAfter`).
- **RF-CAT-09 (Configuración Centralizada):** Mantener la ventana de vigencia (`reviewWindowDays = 30`), la caducidad de reportes (`reportExpiryMinutes = 20`) y las reglas de límites en `config.ts`, sin duplicarlas en pantallas.
- **RF-CAT-10 (Separación Estricta de Reportes):** Mantener los reportes temporales de pasajeros desacoplados del catálogo verificado. Los reportes nunca alteran automáticamente las rutas base.

### Criterios de Aceptación
1. La app carga sin error con catálogo vacío (`routes: []`, `segments: []`) y muestra el estado vacío honesto sin inventar datos.
2. Todo registro sin procedencia (`sourceId` o `verifiedAt`) o con coordenadas fuera de los límites de la ciudad es descartado por el validador.
3. El importador agrupa y secuencia correctamente los puntos de observación de campo.
4. Un segmento `unverified` o `retired` jamás se incluye en un cálculo de ruta.
5. Los datos de prueba llevan prefijo `TEST_` y quedan aislados en tests unitarios, sin compilarse en la aplicación en producción.
6. La consulta de recorridos y el uso de la aplicación no exigen registro, creación de cuenta ni permisos obligatorios de GPS.
