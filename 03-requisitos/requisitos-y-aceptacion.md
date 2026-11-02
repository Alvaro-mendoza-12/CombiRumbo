# Requisitos y criterios de aceptación

## Reglas de negocio

- RN-01: El pasajero puede consultar sin registrarse ni facilitar datos personales.
- RN-02: Solo segmentos con estado `verified` y sin vencimiento crítico participan en una recomendación.
- RN-03: Cada segmento del recorrido guarda procedencia, fecha y método de verificación.
- RN-04: Información oficial, observación directa y reporte de pasajero se identifican por separado.
- RN-05: Los reportes recientes caducan automáticamente y nunca alteran el catálogo verificado por sí solos.
- RN-06: La app no afirma cubrir la ciudad ni representar a una entidad o empresa.
- RN-07: No se publican datos de hogar, conductor o pasajero identificable.
- RN-08: Si faltan datos para responder, el producto explica qué falta y no fabrica una alternativa.

## Requisitos funcionales

| ID | Requisito | Aceptación observable |
|---|---|---|
| RF-01 | Inicio público | La página carga y deja buscar sin cuenta, registro ni pago. |
| RF-02 | Elegir origen y destino | El usuario selecciona puntos de referencia incluidos en el catálogo o escribe un lugar de la cobertura. La geolocalización es opcional y solo completa el origen. |
| RF-03 | Proponer viaje | El motor devuelve itinerarios compuestos únicamente por segmentos verificados; incluye caminata inicial/final, línea y parada observada. |
| RF-04 | Explicar cada tramo | Cada tramo muestra fuente, fecha, estado, instrucciones y campos faltantes. |
| RF-05 | Mostrar tarifa con cautela | Solo muestra tarifa y unidad si existe evidencia. Si falta, muestra “Tarifa por confirmar”. |
| RF-06 | Comparar alternativas | Ordena por menos transbordos y luego caminata estimada; marca el criterio del orden. No afirma ser “más rápida” sin tiempos medidos. |
| RF-07 | Estado sin resultados | Si no existe camino verificado, informa el límite de cobertura y permite corregir el destino o reportar que falta una ruta. |
| RF-08 | Reporte temporal | Un pasajero puede reportar manualmente presencia/ausencia de servicio o cambio visible asociado a una ruta/paradero. El reporte muestra hora y expira. |
| RF-09 | Reportar error de ruta | El usuario marca ruta/paradero incorrecto y escoge motivo; no puede reemplazar el dato oficial en el acto. |
| RF-10 | Sin conexión | Luego de la primera carga, rutas guardadas siguen disponibles offline con etiqueta de fecha de sincronización. Reportes en vivo quedan inhabilitados offline. |
| RF-11 | Idioma | Español por defecto; selector inglés para demo y evaluación. |
| RF-12 | Accesibilidad de controles | Búsqueda, selección, navegación y avisos se usan con teclado y lector de pantalla, sin depender solo del color. |

## Requisitos no funcionales

- RNF-01 **Móvil primero:** usable desde 360 px de ancho y en Android común.
- RNF-02 **Rendimiento:** primera carga ligera; mostrar interfaz en menos de 3 s en conexión móvil corriente como objetivo de prototipo.
- RNF-03 **Accesibilidad:** revisar WCAG 2.2 AA en los flujos esenciales; la revisión no sustituye prueba con usuarios.
- RNF-04 **Disponibilidad funcional:** una falla del servicio de reportes no debe impedir buscar recorridos verificados.
- RNF-05 **Privacidad:** no guardar ubicación del pasajero ni construir historial de viajes.
- RNF-06 **Mantenibilidad:** tipos y validaciones centrales; una sola fuente de verdad para la vigencia de datos.
- RNF-07 **Licencias:** usar dependencias y cartografía con licencias/condiciones compatibles, mostrar atribución requerida.
- RNF-08 **Seguridad:** HTTPS, validación de entradas, límites de frecuencia y protección básica contra spam.

## Criterios de aceptación end-to-end

1. Sin sesión, el usuario hace una búsqueda real cubierta por datos verificados y recibe una instrucción completa.
2. La app no muestra una ruta inventada cuando el destino queda fuera del piloto.
3. Un tramo con observación antigua aparece como desactualizado o no se ofrece; la política debe ser consistente.
4. Tarifa nula o no verificada produce “por confirmar”, nunca un monto calculado.
5. Un reporte recién enviado aparece con hora, etiqueta de reporte y vencimiento; no cambia el recorrido base.
6. Al expirar un reporte, desaparece del estado actual y queda únicamente el registro agregado necesario para métricas, sin ubicación personal.
7. Si el usuario deniega GPS, puede usar origen manual.
8. En modo avión, el catálogo previamente guardado funciona y no presenta reportes en vivo como vigentes.
9. Lighthouse/inspección manual de accesibilidad no registra problemas críticos en la pantalla principal; documentar cualquier limitación.
10. La versión de demo contiene cero datos `TEST_` en las rutas y reportes publicados.

## Métricas

- Búsqueda correcta: origen/destino elegidos y una opción comprendida.
- Tasa de finalización de tarea sin ayuda.
- Tiempo para escoger el abordaje correcto.
- Errores de interpretación de ruta, tarifa o estado.
- Percepción de confianza calibrada: el usuario distingue observación, dato viejo y reporte temporal.
- Cobertura: número de recorridos reales publicados y fecha de última verificación.

No usar vistas, registros o clics como evidencia de que el problema se solucionó.
