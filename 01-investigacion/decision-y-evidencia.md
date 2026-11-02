# Decisión del producto y evidencia disponible

## Decisión

Investigar e implementar **CombiRumbo**, una guía móvil para entender recorridos de transporte público cuya primera prueba de campo será en Chiclayo. El problema —encontrar qué unidad tomar, dónde abordar y dónde descender cuando la información local es difícil de verificar— puede existir en distintas ciudades; Chiclayo es el lugar del piloto, no una afirmación de que la solución ya cubre el mundo. La aplicación debe poder recibir datos y configuración separados por ciudad, pero en esta entrega solo mostrará recorridos de Chiclayo realmente verificados. Esto permite probar una necesidad real con evidencia local y explicar cómo otra ciudad podría incorporarse sin anunciar cobertura que todavía no existe. El proyecto no necesita permiso de una institución para probar el flujo: puede usar observación de recorridos públicos, información abierta con licencia compatible y pruebas voluntarias con pasajeros.

La decisión es **provisional hasta comprobar el problema con pasajeros**. No se han realizado entrevistas ni viajes de prueba para este proyecto; no se deben presentar como hechos. Si la investigación de campo muestra que ya existe una herramienta local suficiente o que los pasajeros no necesitan el producto, descartar o cambiar el enfoque antes de ampliar código.

### Posicionamiento para la competencia

Presentar el alcance con honestidad: **un piloto comprobable en Chiclayo para un problema que puede repetirse en otras ciudades**. La posibilidad de replicación se demostrará con un modelo de datos por ciudad y una explicación concreta de qué datos debe verificar una nueva comunidad; no con rutas de otras ciudades inventadas ni una promesa de expansión. El alcance local no reemplaza la evidencia de impacto: la prueba debe medir si pasajeros reales de Chiclayo pueden resolver un viaje mejor que con las opciones que usan hoy. La convocatoria compara la utilidad y el impacto demostrados, no exige que el prototipo ya tenga cobertura mundial.

## Evidencia de contexto

| Evidencia | Qué permite afirmar | Qué no permite afirmar |
|---|---|---|
| La Municipalidad de Chiclayo y el MTC trabajan en el PMUS y Plan Regulador de Rutas; el MTC comunicó avances en 2026. | La movilidad urbana y la organización de rutas son temas activos de planificación pública. | No prueba que los pasajeros no puedan encontrar su ruta ni que el producto vaya a tener usuarios. |
| El diagnóstico del PMUS incluyó aforos, encuestas origen-destino y caracterización operativa, según la Municipalidad. | Hay estudios públicos de movilidad que podrían aportar contexto. | No asumir que las bases detalladas son descargables o que su licencia permite incorporarlas al producto. |
| Hay información de rutas en plataformas comunitarias como Moovit y Wikiroutes. | Existe competencia y ya hay cierta información colaborativa de transporte. | No se ha medido todavía la cobertura, vigencia ni precisión de esas plataformas en Chiclayo. |
| Hay autorizaciones municipales que describen rutas concretas de transporte urbano/interurbano. | Se pueden localizar referencias públicas para orientar la investigación de campo. | Una resolución de una ruta no contiene necesariamente paraderos, tarifa o frecuencia actual. No importarla sin revisarla y observarla. |

Fuentes principales: [avance del PMUS en Chiclayo, MTC/Promovilidad (12 jul. 2026)](https://www.gob.pe/institucion/mtc/noticias/1417565-mtc-impulsa-sistemas-integrados-de-transporte-mediante-los-planes-de-movilidad-urbana-sostenible), [Municipalidad de Chiclayo: diagnóstico del PMUS (23 feb. 2026)](https://www.gob.pe/institucion/munichiclayo/noticias/1357586-planificacion-urbana-con-exito-concluyen-los-talleres-participativos-para-el-nuevo-plan-de-movilidad-urbana-sostenible-de-chiclayo), [Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-Chiclayo-Lima-stop_33293381-1102), [Wikiroutes](https://wikiroutes.info/es/chiclayo/catalog).

## Problema a comprobar

> Una persona que no conoce bien una línea local no puede decidir rápidamente qué transporte público le sirve, dónde abordarlo y dónde descender; los datos disponibles pueden ser parciales o difíciles de verificar.

Esta frase es una **hipótesis**, no un hallazgo. Para aceptarla, observar como mínimo ocho pasajeros (idealmente estudiantes, trabajadores y personas que no conocen bien la zona) intentando resolver rutas reales. Preguntar qué usan hoy, qué les genera duda y qué error costoso o frustrante han tenido. No inducir respuestas con “¿usarías esta app?”.

## Alternativas que se descartaron para este ciclo

- **Senda Campus:** necesitaba permiso/datos de un campus y su modo ficticio no demostraba utilidad. Se pausa y no se reutiliza.
- **Detector genérico de phishing:** existen herramientas ya orientadas a analizar mensajes y enlaces; para diferenciarlo habría que demostrar una ventaja local concreta. No fue seleccionado.
- **Comparador genérico de alimentos:** MIDAGRI ofrece herramientas de precios y ya hay iniciativas colaborativas; no basta con cambiar la ciudad de cobertura.
- **Mapa genérico de cortes de agua:** SUNASS ya ofrece Cami Yaku y el Semáforo de Interrupciones. Un clon no es suficiente.

## Diferencia que se propone comprobar

La diferencia no es “otro mapa”. Es una guía local con alcance pequeño y datos transparentes:

1. cada tramo publicado tiene fecha, procedencia y estado;
2. los reportes recientes de pasajeros aparecen como señales temporales separadas;
3. no muestra ETAs inventadas ni promete cobertura completa;
4. funciona sin cuenta y explica qué hacer cuando no hay una ruta verificada.

No declarar esta diferencia como exclusiva hasta probar búsqueda de competidores en la tienda de apps, Google, Moovit, Wikiroutes y fuentes locales, y documentar la comparación.

## Puerta de decisión antes de cerrar el alcance

1. Conversar con ocho pasajeros y hacer cinco pruebas de tarea con una ruta que realmente usan.
2. Probar qué información entregan hoy Google Maps, Moovit, Wikiroutes y cualquier app local en los mismos casos.
3. Levantar al menos un recorrido, sus paraderos y una tarifa mediante dos observaciones de campo independientes o una observación directa más confirmación independiente.
4. Publicar el piloto solo si no hay contradicciones críticas. Si la fuente oficial y la observación de campo chocan, mostrar la incertidumbre o no publicar ese tramo.

Si no se confirma una necesidad o no existe ruta verificable antes de la fecha límite, reducir o cambiar el MVP; **no rellenar con información inventada para simular éxito**.
