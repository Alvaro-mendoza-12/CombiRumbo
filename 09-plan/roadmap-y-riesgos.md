# Roadmap y riesgos

## Roadmap (del 1 de noviembre al 4 de diciembre de 2026)

### Fase 0 — confirmar problema y datos (1–4 nov.)

- Entrevistar pasajeros y comparar las apps existentes.
- Elegir un recorrido candidato que la gente realmente use.
- Realizar observaciones de campo y completar `data/observaciones-recorrido.csv`.
- Decidir mantener o descartar la idea según G0/G1.

### Fase 1 — specs y estructura (4–7 nov.)

- Abrir specs de Kiro, revisar requisitos, diseño y tareas.
- Definir tipos/validación de catálogo, búsqueda vacía e importación.
- Crear shell móvil y base visual.

### Fase 2 — flujo principal (8–14 nov.)

- Búsqueda origen/destino.
- Resultado por itinerario, punto de subida y bajada.
- Mostrar fuente, fecha y datos pendientes.
- Añadir una ruta de campo solo después de revisión.

### Fase 3 — mapa, modo offline y reportes (15–21 nov.)

- Mapa ligero con atribución.
- Cache de catálogo previamente abierto.
- Reportes temporales solo si se puede proteger contra spam; no bloquear el MVP.

### Fase 4 — prueba de pasajeros (22–26 nov.)

- Pruebas de tarea en móvil con rutas reales.
- Arreglar errores de ruta, comprensión, accesibilidad y confianza.
- Verificar que dataset y demo no contengan fixtures.

### Fase 5 — entrega (27 nov.–4 dic.)

- Despliegue gratuito y estable, URL sin login.
- Video <3 min, texto inglés, repo GitHub con licencia visible y `.kiro` en raíz.
- Revisión de reglas, privacidad, atribución y pasos de prueba.
- Enviar con margen, no el último día.

## Riesgos

| Riesgo | Señal | Respuesta |
|---|---|---|
| No se confirma dolor real | Pasajeros resuelven fácil con sus herramientas actuales. | Replantear o abandonar antes de invertir en un mapa completo. |
| Rutas cambian o datos parciales | Dos observaciones contradicen fuente o pasajero. | Retirar la línea, mostrar incertidumbre, no usarla en búsqueda. |
| Poca cobertura | Solo existe un corredor. | Presentar piloto pequeño y honesto; no afirmar cobertura urbana. |
| Mapa de tercero cuesta o tiene límites | Se requiere llave/cargo o viola términos. | Usar alternativa legal y ligera; conservar instrucciones textuales. |
| Sin suficientes reportes en vivo | No llegan aportes durante piloto. | No mostrar señal; la búsqueda verificada sigue funcionando. |
| Privacidad/confianza | Personas creen que se rastrea su viaje. | Quitar transmisión, explicar GPS opcional y repetir test. |
| No cabe todo antes de fecha | Semana 3 sin flujo usable. | Eliminar funciones secundarias; mantener búsqueda real, fuente y fecha. |
| App de competidor cubre bien el caso | En prueba supera al prototipo. | Cambiar diferenciación o descartar; no repetir una función que ya resuelve. |

## Prioridades MoSCoW

- **Must:** búsqueda con datos verificables, instrucciones de subida/bajada, fecha/fuente, estado sin resultados, móvil accesible.
- **Should:** mapa y catálogo guardado offline.
- **Could:** reportes temporales de pasajeros, inglés para jueces, favoritos locales.
- **Won't:** rastreo GPS de combis, pagos, toda Chiclayo, login social, IA que inventa rutas.
