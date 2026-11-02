# Spec: Accesibilidad, inglés de presentación y preparación del envío

## Requisitos

### Contexto
La app debe ser accesible (WCAG 2.2 AA como objetivo), móvil primero, con diseño claro y contraste alto. Incluye un selector de idioma ES/EN para materiales del hackathon.

### Requisitos funcionales
- RF-A11Y-01: Búsqueda, selección, navegación y avisos se usan con teclado y lector de pantalla.
- RF-A11Y-02: No depender solo del color para comunicar verificación; usar iconos y texto.
- RF-A11Y-03: Contraste alto y texto legible desde 360 px de ancho.
- RF-A11Y-04: Foco visible, áreas táctiles mínimas, etiquetas en campos.
- RF-A11Y-05: Avisos dinámicos anunciados con `aria-live`.
- RF-A11Y-06: Selector de idioma ES/EN con traducción de la interfaz.
- RF-A11Y-07: Aviso de privacidad y límites visible para el usuario.
- RF-A11Y-08: Preparar estructura para demo: README de la app, licencia, instrucciones para jueces.

### Criterios de aceptación
1. Los flujos principales son navegables con teclado.
2. El estado de verificación se comunica con texto y icono, no solo color.
3. La interfaz es usable desde 360 px de ancho.
4. El selector ES/EN cambia los textos de la interfaz.
5. Lighthouse/inspección manual no registra problemas críticos en la pantalla principal.
6. La versión de demo no contiene datos `TEST_`.
