/**
 * Vista de mapa con Leaflet interactivo.
 * Dibuja el recorrido completo:
 * - Trazado azul discontinuo para caminatas
 * - Trazado sólido con color de ruta para viaje en combi
 * - Marcadores visuales de origen (A), abordaje (🚐), descenso (🛑) y destino (🏁)
 * - Auto-centrado de límites geográficos (fitBounds)
 * - Atribución obligatoria a OpenStreetMap
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Itinerary } from '@/routing/format';
import { ACTIVE_PROVIDER } from './MapProvider';
import { MAP_ATTRIBUTION_OSM } from './attribution';
import type { Catalog } from '@/catalog/types';

interface MapViewProps {
  itinerary: Itinerary;
  catalog?: Catalog;
  height?: string;
}

// Componente para auto-ajustar la vista del mapa a los límites del recorrido
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

// Iconos personalizados con estilos CSS
const originIcon = L.divIcon({
  className: 'custom-pin pin-origin',
  html: '<span>A</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const destIcon = L.divIcon({
  className: 'custom-pin pin-dest',
  html: '<span>🏁</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const boardIcon = L.divIcon({
  className: 'custom-pin pin-board',
  html: '<span>🚐</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

const alightIcon = L.divIcon({
  className: 'custom-pin pin-alight',
  html: '<span>🛑</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

const stopDotIcon = L.divIcon({
  className: 'custom-pin',
  html: '<div style="width:12px;height:12px;background:#38bdf8;border:2px solid #ffffff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

interface RouteSegmentVisual {
  type: 'walk' | 'ride';
  points: [number, number][];
  color: string;
  dashArray?: string;
  weight: number;
}

interface MapMarker {
  id: string;
  title: string;
  subtitle?: string;
  lat: number;
  lon: number;
  type: 'origin' | 'dest' | 'board' | 'alight' | 'stop';
}

export function MapView({ itinerary, height = '320px' }: MapViewProps) {
  const { polylines, markers, bounds, defaultCenter } = useMemo(() => {
    const lines: RouteSegmentVisual[] = [];
    const markerList: MapMarker[] = [];
    const allCoords: [number, number][] = [];

    const steps = itinerary.steps;
    if (steps.length === 0) {
      return {
        polylines: [],
        markers: [],
        bounds: null,
        defaultCenter: [-6.7715, -79.8400] as [number, number],
      };
    }

    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];
    if (!firstStep || !lastStep) {
      return {
        polylines: [],
        markers: [],
        bounds: null,
        defaultCenter: [-6.7715, -79.8400] as [number, number],
      };
    }

    // Marcador de origen (A)
    if (firstStep.fromStop) {
      markerList.push({
        id: `origin-${firstStep.fromStop.id}`,
        title: `Origen: ${firstStep.fromStop.publicName}`,
        subtitle: firstStep.fromStop.landmarkContext,
        lat: firstStep.fromStop.lat,
        lon: firstStep.fromStop.lon,
        type: 'origin',
      });
      allCoords.push([firstStep.fromStop.lat, firstStep.fromStop.lon]);
    }

    // Marcador de destino (🏁)
    if (lastStep.toStop) {
      markerList.push({
        id: `dest-${lastStep.toStop.id}`,
        title: `Destino: ${lastStep.toStop.publicName}`,
        subtitle: lastStep.toStop.landmarkContext,
        lat: lastStep.toStop.lat,
        lon: lastStep.toStop.lon,
        type: 'dest',
      });
      allCoords.push([lastStep.toStop.lat, lastStep.toStop.lon]);
    }

    // Procesar cada paso para líneas y paraderos intermedios
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      if (step.type === 'walk' || step.type === 'direct-walk') {
        const linePts: [number, number][] = [];
        if (step.fromStop) linePts.push([step.fromStop.lat, step.fromStop.lon]);
        if (step.toStop) linePts.push([step.toStop.lat, step.toStop.lon]);

        if (linePts.length >= 2) {
          lines.push({
            type: 'walk',
            points: linePts,
            color: '#0284c7',
            dashArray: '6, 8',
            weight: 4,
          });
          allCoords.push(...linePts);
        }
      } else if (step.type === 'ride') {
        const linePts: [number, number][] = [];

        // Punto de subida
        if (step.fromStop) {
          linePts.push([step.fromStop.lat, step.fromStop.lon]);
          allCoords.push([step.fromStop.lat, step.fromStop.lon]);

          // Agregar marcador de abordaje si no es el origen mismo
          const isOrigin = step.fromStop.id === firstStep.fromStop?.id && firstStep.type !== 'walk';
          const cue = step.boardingTip || step.boardingNote || step.segment?.boardingCue || step.fromStop.landmarkContext;
          markerList.push({
            id: `board-${step.fromStop.id}-${i}`,
            title: `Subir a ${step.route?.label ?? 'Transporte'}`,
            subtitle: cue,
            lat: step.fromStop.lat,
            lon: step.fromStop.lon,
            type: isOrigin ? 'origin' : 'board',
          });
        }

        // Geometría curva / waypoints del segmento
        if (step.segment?.geometry && step.segment.geometry.length > 0) {
          for (const pt of step.segment.geometry) {
            linePts.push(pt);
            allCoords.push(pt);
          }
        }

        // Punto de bajada
        if (step.toStop) {
          linePts.push([step.toStop.lat, step.toStop.lon]);
          allCoords.push([step.toStop.lat, step.toStop.lon]);

          // Agregar marcador de descenso si no es el destino final
          const isDest = step.toStop.id === lastStep.toStop?.id;
          if (!isDest) {
            const cue = step.alightingTip || step.alightingNote || step.segment?.alightingCue || step.toStop.landmarkContext;
            markerList.push({
              id: `alight-${step.toStop.id}-${i}`,
              title: `Bajar en ${step.toStop.publicName}`,
              subtitle: cue,
              lat: step.toStop.lat,
              lon: step.toStop.lon,
              type: 'alight',
            });
          }
        }

        if (linePts.length >= 2) {
          lines.push({
            type: 'ride',
            points: linePts,
            color: step.route?.routeColor || '#f97316',
            weight: 5,
          });
        }
      }
    }

    // Deduplicar marcadores que coincidan en lat/lon
    const uniqueMarkers: MapMarker[] = [];
    const seenPos = new Set<string>();

    // Priorizar tipos: origin > dest > board > alight > stop
    const typePriority: Record<string, number> = { origin: 5, dest: 4, board: 3, alight: 2, stop: 1 };
    markerList.sort((a, b) => (typePriority[b.type] || 0) - (typePriority[a.type] || 0));

    for (const m of markerList) {
      const key = `${m.lat.toFixed(5)},${m.lon.toFixed(5)}`;
      if (!seenPos.has(key)) {
        seenPos.add(key);
        uniqueMarkers.push(m);
      }
    }

    // Calcular bounds geográficos
    const latLngBounds = allCoords.length > 0
      ? L.latLngBounds(allCoords.map(([lat, lon]) => L.latLng(lat, lon)))
      : null;

    const center: [number, number] = allCoords.length > 0
      ? [
          allCoords.reduce((acc, c) => acc + c[0], 0) / allCoords.length,
          allCoords.reduce((acc, c) => acc + c[1], 0) / allCoords.length,
        ]
      : [-6.7715, -79.8400]; // Chiclayo centro

    return {
      polylines: lines,
      markers: uniqueMarkers,
      bounds: latLngBounds,
      defaultCenter: center,
    };
  }, [itinerary]);

  const getMarkerIcon = (type: MapMarker['type']) => {
    switch (type) {
      case 'origin':
        return originIcon;
      case 'dest':
        return destIcon;
      case 'board':
        return boardIcon;
      case 'alight':
        return alightIcon;
      default:
        return stopDotIcon;
    }
  };

  return (
    <div className="map-section">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
        aria-label="Mapa interactivo del recorrido verificado"
      >
        <TileLayer
          url={ACTIVE_PROVIDER.url}
          attribution={ACTIVE_PROVIDER.attribution}
          maxZoom={ACTIVE_PROVIDER.maxZoom}
        />

        {/* Auto-ajuste de límites */}
        <MapBoundsUpdater bounds={bounds} />

        {/* Polylines diferenciadas */}
        {polylines.map((poly, idx) => (
          <Polyline
            key={idx}
            positions={poly.points}
            pathOptions={{
              color: poly.color,
              weight: poly.weight,
              dashArray: poly.dashArray,
              opacity: 0.9,
            }}
          />
        ))}

        {/* Marcadores de paraderos con popups detallados */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lon]}
            icon={getMarkerIcon(m.type)}
          >
            <Popup>
              <div style={{ padding: '2px 4px', maxWidth: '200px' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '2px' }}>
                  {m.title}
                </strong>
                {m.subtitle && (
                  <span style={{ fontSize: '0.78rem', color: '#475569', display: 'block' }}>
                    {m.subtitle}
                  </span>
                )}
              </div>
            </Popup>
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
