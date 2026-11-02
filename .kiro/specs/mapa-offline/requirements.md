# Spec: Mapa móvil y modo sin conexión

## Requisitos

### Contexto
La app debe mostrar un mapa ligero con atribución y funcionar sin conexión después de la primera carga. El mapa no es la prioridad visual; la instrucción de viaje viene primero.

### Requisitos funcionales
- RF-MAP-01: Mostrar un mapa ligero con los stops y geometry de un itinerario seleccionado.
- RF-MAP-02: Incluir atribución visible del proveedor de tiles y licencia.
- RF-MAP-03: Implementar el proveedor de mapa detrás de un adaptador para poder cambiarlo sin tocar componentes.
- RF-MAP-04: No mostrar ubicación de vehículos ni ETA sin telemetría real autorizada.
- RF-MAP-05: Guardar el catálogo en caché local tras la primera carga.
- RF-MAP-06: En modo sin conexión, mostrar rutas guardadas con etiqueta de fecha de sincronización.
- RF-MAP-07: No mostrar reportes en vivo como vigentes en modo offline.
- RF-MAP-08: Indicar el estado de conexión (online/offline) y la fecha del último dato sincronizado.

### Criterios de aceptación
1. El mapa muestra stops y geometry con atribución visible.
2. En modo avión, el catálogo previamente guardado funciona y no presenta reportes como vigentes.
3. La fecha de sincronización se muestra y no se falsea como recién actualizada en offline.
4. No hay marcadores de vehículos en el mapa.
5. El proveedor de tiles es intercambiable mediante el adaptador.
