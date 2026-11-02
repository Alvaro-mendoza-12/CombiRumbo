# Arquitectura propuesta

## Plataforma

PWA web móvil para que jueces y pasajeros accedan desde un enlace sin instalar app desde una tienda. Español por defecto. Catálogo de recorridos consultable sin cuenta. La aplicación debe seguir funcionando para rutas locales si falla el canal de reportes.

## Propuesta técnica inicial

- Frontend: TypeScript con React y Vite, responsive y simple de desplegar en Vercel.
- Mapa: Leaflet o equivalente ligero con atribución visible; implementar proveedor detrás de un adaptador. Verificar condiciones de tiles antes de uso público.
- Rutas: grafo dirigido con paraderos y segmentos verificados; algoritmo de camino mínimo ponderado por transbordos y caminata. Mostrar el criterio de orden, no un tiempo preciso que no se midió.
- Catálogo: JSON versionado en Git para recorridos verificados del pequeño piloto, importador y validación estricta. No secretos.
- Reportes recientes: servicio backend sencillo de bajo costo solo si se necesita para compartir reportes entre usuarios. Mantener su interfaz desacoplada; respetar seguridad, vencimiento y privacidad. Kiro debe comparar opciones actuales y documentar cualquier costo/clave antes de elegir.
- Offline: service worker y cache solo para app y catálogo que ya se descargó; no usar datos antiguos sin su marca de fecha.

## Módulos

1. `catalog`: tipos, validador, parser/importador y procedencia.
2. `routing`: grafo, filtros de validez y cálculo de alternativas.
3. `reports`: envío/lectura de señales temporales y caducidad.
4. `map`: dibuja tramos/landmarks con atribución.
5. `search`: origen/destino y geolocalización opcional local.
6. `pwa`: instalabilidad, cache y estados offline.
7. `accessibility`: componentes navegables, mensajes y preferencias visuales.

## Modelo mínimo

```text
Route(id, label, direction, operatorName?, status, sourceId, verifiedAt, reviewAfter)
Stop(id, publicName, lat, lon, sourceId, verifiedAt)
Segment(id, routeId, fromStopId, toStopId, geometry, boardingNote, alightingNote,
        fare?, fareUnit?, sourceId, evidenceMethod, status, observedAt)
Source(id, type, title, url?, license?, observedAt, notes)
LiveReport(id, routeId, stopId, kind, createdAt, expiresAt, countBucket)
```

Campos opcionales no se rellenan por inferencia. Evitar guardar `reporterId`, IP, GPS del usuario o datos de viaje.

## Regla de selección

Un segmento participa en búsqueda solo si `status=verified`, sus datos mínimos están completos y `reviewAfter` no venció. Dato faltante cambia el texto de la respuesta, no se sustituye por una cifra inventada. Ruta fuera de alcance retorna resultado vacío y explicación.

## Despliegue

Diseñar para build estático en Vercel; no publicar hasta que el participante revise información de campo, política de datos, costos y acceso de pruebas. Nunca guardar tokens en Git. Si se agrega servicio backend, mantener la consulta de catálogo funcional si no está disponible.
