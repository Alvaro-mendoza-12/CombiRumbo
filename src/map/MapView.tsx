/**
 * Vista de mapa con Leaflet.
 * Dibuja stops y geometry de un itinerario con atribución.
 * No muestra ubicación de vehículos ni ETA.
 */

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Itinerary } from '@/routing/format';
import { ACTIVE_PROVIDER } from './MapProvider';
import { MAP_ATTRIBUTION_OSM } from './attribution';

import type { Catalog } from '@/catalog/types';

// Fix default icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface MapViewProps {
  itinerary: Itinerary;
  catalog?: Catalog;
}

export function MapView({ itinerary }: MapViewProps) {
  // Recoger todos los puntos del itinerario
  const points = useMemo(() => {
    const pts: [number, number][] = [];
    const stops: { id: string; name: string; lat: number; lon: number; isBoard?: boolean; isAlight?: boolean }[] = [];

    let isFirstRide = true;
    for (const step of itinerary.steps) {
      if (step.type === 'walk') {
        if (step.fromStop) stops.push({ id: step.fromStop.id, name: step.fromStop.publicName, lat: step.fromStop.lat, lon: step.fromStop.lon });
        if (step.toStop) stops.push({ id: step.toStop.id, name: step.toStop.publicName, lat: step.toStop.lat, lon: step.toStop.lon });
        // Línea de caminata
        if (step.fromStop && step.toStop) {
          pts.push([step.fromStop.lat, step.fromStop.lon], [step.toStop.lat, step.toStop.lon]);
        }
      } else if (step.type === 'ride') {
        if (step.fromStop) {
          stops.push({ id: step.fromStop.id, name: step.fromStop.publicName, lat: step.fromStop.lat, lon: step.fromStop.lon, isBoard: isFirstRide });
          pts.push([step.fromStop.lat, step.fromStop.lon]);
        }
        if (step.toStop) {
          stops.push({ id: step.toStop.id, name: step.toStop.publicName, lat: step.toStop.lat, lon: step.toStop.lon, isAlight: true });
          pts.push([step.toStop.lat, step.toStop.lon]);
        }
        isFirstRide = false;

        // Geometry del segmento si existe
        if (step.segment?.geometry) {
          for (const point of step.segment.geometry) {
            pts.push(point);
          }
        }
      }
    }

    // Calcular centro del mapa
    const center: [number, number] = pts.length > 0
      ? [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
      : [-6.7715, -79.8400]; // Chiclayo centro como fallback

    return { pts, stops, center };
  }, [itinerary]);

  // Deduplicar stops por id
  const uniqueStops = useMemo(() => {
    const seen = new Set<string>();
    return points.stops.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [points]);

  return (
    <div className="map-container">
      <MapContainer
        center={points.center}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '300px', width: '100%' }}
        aria-label="Mapa del recorrido"
      >
        <TileLayer
          url={ACTIVE_PROVIDER.url}
          attribution={ACTIVE_PROVIDER.attribution}
          maxZoom={ACTIVE_PROVIDER.maxZoom}
        />

        {/* Línea del recorrido */}
        {points.pts.length > 1 && (
          <Polyline
            positions={points.pts}
            pathOptions={{ color: '#e07a3e', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Marcadores de stops */}
        {uniqueStops.map(stop => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lon]}
          >
          </Marker>
        ))}
      </MapContainer>
      <div className="map-attribution-note">
        {MAP_ATTRIBUTION_OSM}
      </div>
    </div>
  );
}

export default MapView;
