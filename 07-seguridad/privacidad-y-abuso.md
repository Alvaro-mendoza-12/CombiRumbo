# Seguridad, privacidad y límites

## Datos personales

Consulta anónima por defecto. La app no necesita DNI, cuenta, teléfono, dirección residencial ni historial. Solicita GPS solo al tocar “Usar mi ubicación”; usa coordenadas en la sesión para fijar origen y no las transmite ni guarda. Si la librería de mapa o geocodificación enviaría coordenadas a un tercero, indicarlo antes de activar el servicio y ofrecer búsqueda manual.

Los reportes no identifican al pasajero. El catálogo conserva puntos de ruta públicos, no recorridos personales. No subir fotos de personas, choferes o placas. No almacenar registros con IP de forma persistente. La conservación de reportes caducados se limita a conteos agregados sin identificadores.

## Confianza y seguridad física

- La app no es un servicio oficial, no garantiza que una unidad pase ni que una parada sea segura.
- No dibujar una ubicación de vehículo si no hay fuente GPS autorizada; mostrar “sin reporte reciente”.
- No describir una ruta como accesible o segura sin evaluación específica.
- Incluir “verifica la línea y el destino en el letrero antes de abordar”.
- No guiar a una persona hacia una calle no observada ni promover mirar pantalla al caminar/cruzar.
- Mostrar fecha y limitación de cada dato.

## Reportes y abuso

El catálogo verificado y los reportes temporales viven en flujos separados. Limitar reportes repetidos, validar tipo/ruta/paradero, moderar cambios estructurales y permitir ocultar reportes abusivos. No automatizar etiquetas de “peligroso” o “fraudulento” sobre personas/operadores.

Si no se puede implementar limitación razonable contra spam, desactivar envío público y dejar el catálogo consultable; no simular que un formulario enviará a la comunidad.

## Seguridad técnica

- Validar entradas en cliente y servidor; no inyectar HTML recibido de usuarios.
- CORS restrictivo en backend, rate limit, RLS si se usa base externa, HTTPS, dependencias mínimas.
- Mantener secrets en entorno de despliegue, nunca en `.env` versionado.
- No ejecutar scripts destructivos ni hooks de Kiro que borren o publiquen sin confirmación.

## Aviso al usuario

“CombiRumbo es un piloto comunitario independiente. La información puede cambiar. Confirma la línea y el destino con el rótulo del vehículo. Los reportes de pasajeros son observaciones puntuales; no son rastreo oficial ni garantía de llegada.”
