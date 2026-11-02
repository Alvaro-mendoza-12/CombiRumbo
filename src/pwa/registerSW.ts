/**
 * Registro del service worker para PWA offline.
 * Usa vite-plugin-pwa con autoUpdate.
 */

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch {
    // vite-plugin-pwa no está disponible en dev sin build; no es crítico.
  }
}
