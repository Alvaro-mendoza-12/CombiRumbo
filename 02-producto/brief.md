# Brief de CombiRumbo Chiclayo

## Propósito

Ayudar a pasajeros a resolver una decisión cotidiana de viaje: **qué transporte tomar, dónde subir y dónde bajar**, con instrucciones basadas en datos reales y con la fecha y procedencia a la vista. El producto puede adaptarse a otras ciudades que aporten recorridos verificados; el primer piloto y la única cobertura de esta entrega son Chiclayo, Perú.

## Usuarios iniciales

- Personas que recién viven, estudian o trabajan en Chiclayo y no conocen las líneas.
- Pasajeros que quieren comprobar si una ruta llega a un destino público común.
- Visitantes que conocen el lugar de origen y destino, pero no el nombre de la línea o paradero.

Estos perfiles son hipótesis. Las entrevistas deben confirmar cuál sufre más el problema y qué palabras usa para describirlo.

## Trabajo que realiza el usuario

“Cuando quiero ir a un lugar de Chiclayo usando transporte público y no conozco bien las rutas, quiero saber qué vehículo tomar y dónde subir y bajar, para hacer el viaje con menos dudas y sin depender de preguntar a varias personas.”

## Promesa del MVP

Para la cobertura piloto, CombiRumbo mostrará una instrucción simple entre dos puntos: caminata al paradero observado, identificación de la línea, tramo en transporte, descenso y caminata final. La app dice cuándo se observó el recorrido y si falta confirmar tarifa, parada o frecuencia. La estructura separa ciudad y recorridos para que una comunidad de otra ciudad pueda añadir su propia información verificada; esa capacidad de ampliación no significa que CombiRumbo ya tenga cobertura ni datos allí.

## Alcance inicial

- Un corredor o un número pequeño de recorridos que el participante haya observado y verificado.
- Un solo piloto activo: Chiclayo. Los datos de recorridos deben pertenecer a una ciudad identificada para evitar mezclar lugares; una ciudad sin datos verificados debe mostrar claramente que todavía no tiene cobertura.
- Puntos de referencia públicos, no direcciones residenciales privadas.
- Rutas sugeridas solo con segmentos verificados y vigentes.
- Una PWA de celular, con consulta sin cuenta y cache de rutas guardadas.
- Reportes recientes de pasajeros como complemento, con fecha/hora y vencimiento; nunca se hacen pasar por posición GPS.
- Idioma español por defecto; traducción inglesa suficiente para los materiales del hackathon.

## Fuera de alcance

- Cubrir todos los distritos o garantizar la mejor ruta de toda la ciudad.
- Anunciar cobertura internacional, añadir datos de otras ciudades o crear un selector de ciudades con opciones vacías solo para aparentar alcance.
- GPS de combis, ETA, aforo o frecuencias en vivo sin integración/medición real.
- Afirmar seguridad, accesibilidad para silla de ruedas o funcionamiento de una parada sin verificación específica.
- Compra de pasajes, pago, anuncios, perfiles, cuentas o historial de movimiento.
- Integración institucional, solicitud de permiso o acceso privado como condición del producto.
- IA generativa como juez de datos. Puede ayudar a explicar una instrucción, pero las rutas y tarifas siguen viniendo de datos estructurados y trazables.

## Éxito del piloto

En una prueba con al menos cinco pasajeros y recorridos reales:

- 4 de 5 completan una tarea de búsqueda sin ayuda del moderador;
- 4 de 5 identifican correctamente el punto de subida y descenso;
- la mediana para encontrar una instrucción correcta es menor de 60 segundos;
- ninguna ruta se muestra sin fuente y fecha;
- ningún evaluador cree que la app rastrea los buses cuando no existe ese dato;
- todos los errores y contradicciones encontrados quedan resueltos o visibles antes del video.

Las metas se ajustan después de la prueba de comprensión; no se alteran para aparentar éxito.

## Principios de producto

1. **Primero una instrucción útil, luego el mapa.**
2. **La evidencia es visible.** Fecha, fuente y estado acompañan cada dato relevante.
3. **Sin ruta es una respuesta válida.** No completar huecos con suposiciones.
4. **El pasajero conserva el control.** Ubicación opcional, procesamiento local y sin cuenta para consultar.
5. **Una observación no es una garantía.** Usar lenguaje prudente y cotidiano.
6. **No parecer una app municipal.** Marca propia, sin escudos ni promesas oficiales.
