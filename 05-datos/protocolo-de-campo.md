# Datos reales y protocolo de campo

## Fuente de verdad

El catálogo solo puede contener datos con procedencia. Fuentes potenciales:

1. Observación directa del participante en un viaje público.
2. Confirmación independiente de otra persona pasajera que haya recorrido el tramo.
3. Documento municipal vigente y público, solo si sus condiciones permiten reutilización.
4. Datos de OpenStreetMap únicamente para calles/elementos cartográficos bajo sus condiciones de licencia y atribución; OSM no prueba por sí mismo qué combi circula.

Moovit y Wikiroutes se consultan para investigar competencia o encontrar preguntas de campo. No copiar sus rutas, textos o bases sin una licencia o permiso que permita reutilización.

## Qué registrar

Para cada recorrido y tramo:

- identificador interno no personal;
- etiqueta que los pasajeros usan para identificar la unidad;
- origen/destino de la observación;
- paradero o referencia pública para subir y bajar;
- puntos de ruta capturados con GPS durante el viaje, si la persona lo hace de forma segura;
- fecha, hora local, dirección y tipo de día;
- tarifa observada y cómo se confirmó, o `unknown`;
- fuente, método, segunda verificación y contradicciones;
- fecha límite de revisión y estado;
- responsable codificado, sin nombre público.

No grabar cara, voz, placa, DNI, número de teléfono, ubicación de vivienda ni rastros GPS de pasajeros. No conducir ni cruzar mientras se usa el teléfono. Si no se puede registrar con seguridad, tomar notas al finalizar el trayecto.

## Protocolo mínimo por ruta

1. Elegir dos destinos públicos que los pasajeros realmente usan.
2. Confirmar con pasajeros qué línea/identificador reconocen, sin sugerir una respuesta.
3. Hacer al menos dos observaciones independientes del mismo tramo o una observación directa más una confirmación independiente.
4. Recorrer la línea en condiciones distintas si es necesario confirmar dirección, paraderos o variación de ruta.
5. Confirmar el nombre de referencia y la tarifa; guardar `unknown` si no pudo confirmarse.
6. Comparar con fuentes públicas actuales y registrar discrepancias.
7. Revisar la entrada con otra persona antes de incorporarla.
8. Publicar solo el alcance que quedó confirmado, con fecha de revisión.

La observación de un único viaje sirve como evidencia preliminar, no como garantía de que la ruta opere siempre. No inferir frecuencia o llegada futura desde una observación aislada.

## Estados del registro

- `verified`: cumple el protocolo y está dentro de su ventana de revisión.
- `aging`: la revisión recomendada venció; aún puede mostrarse con aviso si producto y usuario lo aprueban.
- `unverified`: fuente insuficiente o contradicción; no se usa en resultados.
- `retired`: se comprobó que dejó de operar o se retiró voluntariamente.

La duración de vigencia debe ser editable en un solo archivo/configuración. Propuesta para el piloto: revisar cada recorrido cada 30 días y volverlo `aging`; no es norma pública, sino control interno que se revisa con usuarios.

## Reportes temporales de pasajeros

Los reportes describen una observación de momento (ej. “vi una unidad en este paradero”). Deben llevar ruta/paradero seleccionados manualmente, instante de creación, categoría y estado. No capturan posición del emisor. Vencen en 20 minutos inicialmente; esa duración es una hipótesis de producto, no una promesa de servicio.

La interfaz siempre dice “reporte de pasajero” y muestra cantidad. Un reporte no crea ni modifica rutas verificadas; varios reportes pueden disparar revisión humana. Si hay abuso, ocultar reportes y conservar búsqueda base.

## Validación de importación

Rechazar archivos con coordenadas fuera de rango, fechas faltantes, ruta sin procedencia o referencias privadas. La plantilla `data/observaciones-recorrido.csv` solo tiene encabezados: cada fila futura representa un punto de una observación, no una ruta real. Usa el mismo `observation_id` para agrupar los puntos del viaje y aumenta `point_sequence` en orden. El catálogo inicial `data/recorridos-verificados.json` está vacío de forma intencional.
