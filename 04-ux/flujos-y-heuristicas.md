# UX: flujos, wireframes y heurísticas

## Tono y diseño

Español peruano claro: “¿A dónde vas?”, “Dónde subir”, “Dónde bajar”, “Visto hace…”, “Dato por confirmar”. Evitar jerga de datos y promesas como “llegas en 10 min” sin medición. Puede tener una identidad nocturna apropiada para Kiroween, pero contraste, lectura y orientación tienen prioridad.

## Flujo A: buscar viaje

1. Inicio: origen y destino, botón “Buscar ruta”, botón discreto “Usar mi ubicación”.
2. Origen: selección manual o ubicación opcional. Mostrar que la ubicación no se guarda.
3. Destino: sugerir solo landmarks confirmados dentro de la cobertura piloto.
4. Resultados: tarjeta por opción; título principal “Toma [línea verificada]”, caminata, punto de subida, bajada y fecha de verificación. Reportes recientes van en una fila separada.
5. Detalle: mapa/recorrido, instrucciones por pasos, fuentes, incertidumbres, tarifa o etiqueta “por confirmar”.
6. Durante el viaje: modo lectura grande para subir/bajar; no rastrear movimiento.
7. Después: “¿La instrucción coincidió con tu viaje?” Sí / No / No viajé. La respuesta de prueba no cambia automáticamente el dato.

## Flujo B: cobertura insuficiente

1. El usuario busca un destino sin segmento verificado.
2. Mensaje: “Todavía no tenemos un recorrido verificado para este viaje”.
3. Acciones: cambiar punto, ver recorrido cubierto, avisar que falta ruta.
4. La app no dibuja un tramo especulativo ni recomienda “pregunta a cualquiera” como si fuera resultado suyo.

## Flujo C: reportar cambio observado

1. Elegir recorrido/paradero desde la app; no capturar ubicación automáticamente.
2. Elegir tipo: “pasó una unidad”, “no pasó en esta observación”, “paradero cambiado”, “otro”.
3. Mostrar hora local y pedir confirmación antes de enviar.
4. El reporte aparece como “1 pasajero reportó…” y caduca según configuración.
5. Una persona revisa repetición de reportes antes de cambiar catálogo verificado.

## Wireframes textuales

### Inicio (móvil)

```text
CombiRumbo · Chiclayo                         ES | EN
Tu combi, sin adivinar.
[ Origen: Mercado Modelo                    v ]
[ Destino: ¿A dónde vas?                    v ]
[ Buscar ruta ]
Ubicación: opcional · No guardamos por dónde viajas

Cobertura piloto: [nombre de zona confirmada]
Solo mostramos recorridos con fecha y fuente.
```

### Resultado

```text
1 opción verificada
Toma [identificador real de línea]
SUBE  Paradero observado · [landmark]
BAJA [landmark confirmado]
Camina: [distancia calculada o “aprox.”]
Tarifa: S/ [valor verificado] · visto [fecha]
Ruta observada: [fecha] · Fuente: observación de campo

Reporte pasajero: [si existe] “1 reporte · hace 8 min”
[Ver pasos] [Ver mapa] [Reportar un cambio]
```

### Sin ruta

```text
No tenemos una ruta verificada para este viaje.
No mostramos recorridos sin comprobar.
[Cambiar destino] [Ver cobertura piloto]
[Avisar que falta esta ruta]
```

Los corchetes son campos, no información de una ruta existente. No publicar el wireframe con valores inventados.

## 10 heurísticas de Nielsen

| Heurística | Aplicación comprobable |
|---|---|
| 1. Visibilidad del estado | Mostrar buscando, resultado, sin conexión, dato viejo y hora del reporte. |
| 2. Correspondencia con el mundo real | “Sube”, “baja”, “paradero” y nombres usados en la calle. |
| 3. Control y libertad | Editar origen/destino, volver atrás, cancelar GPS y corregir selección. |
| 4. Consistencia y estándares | Usar las mismas etiquetas, iconos y estados en mapa, tarjeta y detalle. |
| 5. Prevención de errores | Evitar sugerir tramo sin verificación; pedir confirmación de reporte. |
| 6. Reconocimiento antes que recuerdo | Mostrar los puntos de subida/bajada y línea al mismo tiempo; no pedir memorizar códigos. |
| 7. Flexibilidad y eficiencia | Permitir buscar por nombre y guardar destinos frecuentes localmente. |
| 8. Diseño minimalista | En resultado, priorizar transporte y próximos pasos; ocultar detalles bajo “fuente y datos”. |
| 9. Recuperación de errores | Explicar búsqueda sin resultado, dato vencido y error de red con acción concreta. |
| 10. Ayuda y documentación | Ofrecer una guía breve para leer verificación, reporte y tarifa por confirmar. |

## Revisión de accesibilidad

Verificar contraste, tamaño de texto, foco visible, áreas táctiles, control por teclado, etiquetas de campos, lectura de avisos y compatibilidad con zoom. Color no debe ser la única señal de verificación. No afirmar conformidad completa sin una auditoría y pruebas con usuarios.
