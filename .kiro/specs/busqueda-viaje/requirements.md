# Spec: Búsqueda de viaje y explicación de subir/bajar

## Requisitos

### Contexto
El usuario debe poder buscar entre origen y destino y recibir instrucciones compuestas únicamente por segmentos verificados. Si no hay ruta verificada, la app explica el límite sin inventar.

### Requisitos funcionales
- RF-BUS-01: Mostrar pantalla de inicio con campos de origen y destino y botón "Buscar ruta".
- RF-BUS-02: Permitir seleccionar origen y destino entre landmarks del catálogo o escribir manualmente.
- RF-BUS-03: Ofrecer geolocalización opcional para autocompletar el origen; procesar localmente, no guardar ni enviar.
- RF-BUS-04: Calcular itinerarios compuestos solo por segmentos con estado `verified` y dentro de `reviewAfter`.
- RF-BUS-05: Mostrar cada opción con: línea, punto de subida, punto de bajada, caminata estimada, fecha de verificación.
- RF-BUS-06: Mostrar tarifa solo si existe evidencia; si no, mostrar "Tarifa por confirmar".
- RF-BUS-07: Ordenar opciones por menos transbordos y luego caminata estimada; marcar el criterio de orden. No afirmar "más rápida".
- RF-BUS-08: Si no existe camino verificado, mostrar "Todavía no tenemos un recorrido verificado para este viaje" y permitir corregir.
- RF-BUS-09: Cada tramo muestra fuente, fecha, estado e incertidumbres.
- RF-BUS-10: Mostrar fecha de sincronización del catálogo.

### Criterios de aceptación
1. Una búsqueda entre dos puntos cubiertos por segmentos verificados devuelve una instrucción completa.
2. La app no muestra una ruta inventada cuando el destino está fuera del piloto.
3. Tarifa nula o no verificada produce "por confirmar", nunca un monto calculado.
4. Un tramo con observación antigua aparece como desactualizado o no se ofrece.
5. Si el usuario deniega GPS, puede usar origen manual.
6. El criterio de orden se muestra y no afirma velocidad sin medición.
