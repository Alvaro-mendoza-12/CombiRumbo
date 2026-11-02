# Diseño: Accesibilidad, inglés y preparación de envío

## Arquitectura

```
src/accessibility/
├── i18n.ts           # Sistema de traducción ES/EN
├── a11y.ts           # Utilidades de accesibilidad (aria, foco, contraste)
├── A11yProvider.tsx  # Provider de preferencias de accesibilidad
└── VisuallyHidden.tsx # Componente para texto solo para lectores de pantalla

src/i18n/
├── es.ts             # Traducciones español (Perú)
└── en.ts             # Traducciones inglés (demo)
```

## Internacionalización (i18n.ts)

```typescript
type Lang = 'es' | 'en';
type TranslationKey = 'search.placeholder.origin' | 'search.button.find' | ...;

function t(key: TranslationKey, lang: Lang): string;
function useLang(): [Lang, (lang: Lang) => void];
```

- Diccionario plano con claves anidadas por pantalla.
- Persistencia de idioma en localStorage.
- Español por defecto; inglés para demo.

## Accesibilidad (a11y.ts)

- `announce(message)`: publica en un region aria-live.
- `setStatusIcon(status)`: devuelve icono + texto (no solo color).
- Estados: verified (check verde + "Verificado"), aging (reloj ámbar + "Dato antiguo"), unverified (x + "Sin verificar"), retired (tache + "Retirado").
- Foco visible con outline de alto contraste.
- Áreas táctiles mínimas 44x44 px.

## Componentes accesibles

- Todos los campos tienen `<label>` asociado.
- Botones tienen `aria-label` descriptivo.
- Avisos de estado usan `role="status"` o `role="alert"`.
- El mapa tiene `title` y `aria-label` con descripción.
- Navegación por teclado con skip-link.

## Aviso al usuario

Componente fijo con el texto:
"CombiRumbo es un piloto comunitario independiente. La información puede cambiar. Confirma la línea y el destino con el rótulo del vehículo. Los reportes de pasajeros son observaciones puntuales; no son rastreo oficial ni garantía de llegada."

## Preparación de envío
- `LICENSE` con licencia open source (MIT).
- `README` de la app con instrucciones para jueces.
- Verificar que el build no incluye fixtures `TEST_`.
- `.kiro` versionado en el repo.
