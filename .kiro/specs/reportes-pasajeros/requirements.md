# Spec: Reportes de pasajeros con caducidad y límites contra abuso

## Requisitos

### Contexto
Los reportes de pasajeros son observaciones temporales ("vi una unidad en este paradero"). Deben separarse del catálogo verificado, tener fecha, caducar y prevenir abuso. Si no se puede proteger contra spam, se deja la función fuera y se explica la limitación.

### Requisitos funcionales
- RF-REP-01: Un pasajero puede reportar manualmente presencia/ausencia de servicio o cambio visible asociado a una ruta/paradero.
- RF-REP-02: El reporte muestra hora local y caduca según configuración (inicialmente 20 minutos).
- RF-REP-03: El reporte se rotula "reporte de pasajero" y muestra cantidad; nunca aparece como ETA ni posición GPS.
- RF-REP-04: Un reporte no crea ni modifica rutas verificadas.
- RF-REP-05: Limitar reportes repetidos para prevenir spam (rate limit por bucket de tiempo y ruta).
- RF-REP-06: Si el servicio de reportes falla, la búsqueda de recorridos verificados sigue funcionando.
- RF-REP-07: Si no se puede implementar limitación razonable contra spam, desactivar envío público y dejar el catálogo consultable.

### Criterios de aceptación
1. Un reporte recién enviado aparece con hora, etiqueta de reporte y vencimiento; no cambia el recorrido base.
2. Al expirar un reporte, desaparece del estado actual; queda solo el conteo agregado sin identificadores.
3. Los reportes se muestran en una fila separada del recorrido verificado.
4. La caída del servicio de reportes no impide buscar recorridos.
5. No se muestra una ETA ni posición de combi basada en reportes.
