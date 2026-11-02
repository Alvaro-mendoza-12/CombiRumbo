---
inclusion: always
---
# Tecnología y estructura

Construir una PWA TypeScript, móvil y ligera. El diseño propuesto usa React/Vite para facilitar una publicación web; verifica versiones actuales y elige dependencias activas y mínimas. Mantén routing, catálogo, fuentes, reportes, mapa y offline desacoplados.

- Mantener `data/recorridos-verificados.json` con esquema y procedencia.
- Catálogo vacío es estado válido hasta que el participante añada una observación real.
- No incluir fixtures `TEST_` en producción.
- No guardar secretos en código ni ignorar `.kiro/` en Git.
- Seguir el flujo de Kiro Feature Specs (requisitos, diseño y tareas) por función.
- Crear verificaciones funcionales solicitadas por el participante y reportar solo lo ejecutado.
- No ejecutar despliegue/push/publicación automáticamente.
