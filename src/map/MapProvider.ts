/**
 * Adaptador para proveedor de tiles de mapa.
 * Permite cambiar el proveedor sin tocar MapView.
 * OSM es la opción inicial: gratuita con licencia ODbL y atribución.
 */

export interface TileProvider {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

/** Proveedor OpenStreetMap — licencia ODbL, requiere atribución. */
export const OSM_PROVIDER: TileProvider = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: ['a', 'b', 'c'],
};

/** Proveedor activo. Cambiar aquí para usar otro proveedor. */
export const ACTIVE_PROVIDER: TileProvider = OSM_PROVIDER;
