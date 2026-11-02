# Plan de validación con datos y viajes reales

## Objetivo

Comprobar que una persona puede encontrar, entender y seguir una instrucción de viaje real del piloto, y que comprende de dónde salen los datos y cuáles son sus límites. No medir solo si le gusta el diseño.

## Preparación de campo

1. Seleccionar una ruta usada por pasajeros, no una elegida solo por facilidad de programación.
2. Completar el protocolo de observación dos veces con fecha y fuente.
3. Preparar la prueba en un lugar donde el participante pueda empezar una ruta real; nunca pedir que mire la pantalla al caminar o cruzar.
4. Reclutar al menos 5 pasajeros para prueba de tarea; entrevistar hasta 8 o más si se consigue muestra diversa.
5. No registrar nombres ni videos de usuarios sin consentimiento. Para observación, registrar resultados anónimos.

## Tareas de prueba

- “Estás en [lugar público real] y quieres llegar a [destino público real]. Muéstrame cómo irías usando transporte público.”
- “¿Dónde subirías y dónde bajarías?”
- “¿Cuándo se observó esta información? ¿En qué confiarías y qué verificarías?”
- “Si no aparece ruta, ¿qué entiendes que significa?”
- “Si ves una combi ahora, ¿qué harías para reportarlo?”

El moderador no explica la interfaz hasta registrar el primer intento.

## Medidas

| Métrica | Registro |
|---|---|
| Completó sin ayuda | Sí/No y bloqueo concreto. |
| Identificó línea, subida y bajada | Tres resultados por tarea. |
| Tiempo hasta decisión | Segundos desde abrir búsqueda hasta elegir opción. |
| Interpretó estado de confianza | Explica qué significa fecha, fuente y reporte. |
| Error de ruta o dato | Diferencia entre instrucción y recorrido observado. |
| Privacidad percibida | ¿Cree que guardamos dónde viaja? ¿Por qué? |

## Puertas de calidad

- **G0 — problema:** al menos cinco de ocho entrevistados mencionan espontáneamente una dificultad concreta de identificar ruta/subida/bajada o usan una herramienta informal para resolverla. Si no, revisar el problema.
- **G1 — datos:** el primer recorrido cumple el protocolo de campo y no tiene contradicción crítica sin resolver.
- **G2 — uso:** por lo menos 4/5 completan la tarea sin ayuda; si no, simplificar antes de añadir funciones.
- **G3 — confianza:** nadie confunde un reporte de pasajero con GPS o garantía. Si ocurre, cambiar etiquetas y repetir.
- **G4 — demo:** desplegar solo cuando la búsqueda real funcione en móvil y el dataset publicado contenga evidencia legible.

## Pruebas del software

Automatizar:

- parser/importador rechaza ruta sin fuente, coordenadas malas o status inválido;
- enrutador solo usa segmentos elegibles;
- ruta directa, con transbordo, sin conexión de grafo y con datos vencidos;
- tarifa ausente aparece por confirmar;
- reporte expirado no aparece como actual;
- permisos GPS denegados siguen permitiendo búsqueda manual;
- cache offline no muestra fecha como recién actualizada;
- pantalla adaptable y teclado/lector de pantalla en los flujos principales.

Separar fixtures `TEST_` de cualquier dataset público y verificar que no se incluyan en el build de demo.

## Registro y resultado

Guardar un resumen anónimo: fecha, cantidad de participantes, tareas, medidas agregadas, incidencias, cambios realizados y limitaciones. No redactar hallazgos antes de hacer las pruebas. La presentación debe reportar números reales, aunque sean pequeños.
