# Diseño: Reportes de pasajeros

## Arquitectura

```
src/reports/
├── types.ts         # Tipos de LiveReport y ReportKind
├── store.ts         # Almacenamiento local de reportes (localStorage)
├── expiry.ts        # Lógica de caducidad y limpieza
├── rateLimit.ts     # Límites contra spam
└── ReportsView.tsx  # Componente de envío y visualización de reportes
```

## Almacenamiento (store.ts)

- Los reportes se guardan en `localStorage` con key `combirumbo_reports`.
- No se guarda `reporterId`, IP ni ubicación del emisor.
- `addReport(routeId, stopId, kind)`: crea reporte con createdAt y expiresAt.
- `getActiveReports(routeId)`: devuelve reportes no expirados para una ruta.
- `getAllActiveReports()`: devuelve todos los reportes no expirados.
- `getExpiredCounts()`: devuelve conteos agregados sin identificadores.
- `pruneExpired()`: elimina reportes expirados del almacenamiento activo.

## Caducidad (expiry.ts)

```typescript
function isExpired(report: LiveReport, now: Date): boolean {
  return new Date(report.expiresAt) <= now;
}

function timeUntilExpiry(report: LiveReport, now: Date): number {
  return Math.max(0, new Date(report.expiresAt).getTime() - now.getTime());
}
```

## Límites contra spam (rateLimit.ts)

```typescript
function canReport(store: ReportStore, routeId: string, now: Date): boolean {
  const bucket = getMinutesBucket(now, 5);  // bucket de 5 min
  const count = store.reports.filter(r =>
    r.routeId === routeId && sameBucket(r.createdAt, bucket)
  ).length;
  return count < CATALOG_CONFIG.maxReportsPerBucket;
}
```

- Límite: `maxReportsPerBucket` reportes por ruta por bucket de 5 minutos.
- Si se supera, se rechaza el reporte con mensaje explicativo.
- Los reportes no identifican al emisor; el límite es por bucket+ruta, no por usuario.

## Componente (ReportsView.tsx)

- Formulario: seleccionar ruta/paradero del catálogo (no captura ubicación automáticamente).
- Tipo: "pasó una unidad" | "no pasó en esta observación" | "paradero cambiado" | "otro".
- Muestra hora local y pide confirmación antes de enviar.
- Tras enviar: "1 pasajero reportó… hace X min".
- Reportes en fila separada del recorrido verificado.
- En modo offline: el envío de reportes se deshabilita.

## Decisión de implementación
- Los reportes funcionan solo en cliente (localStorage). No requieren backend para el MVP.
- Esto cumple RF-REP-07: si el rate limit no basta, se puede desactivar el envío sin afectar la búsqueda.
- Al ser localStorage, los reportes son por dispositivo; no se comparten entre usuarios en el MVP. Esto es una limitación honesta que se documenta.
