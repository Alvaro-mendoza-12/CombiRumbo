/**
 * Vista de mapa interactiva con Leaflet.
 * Modo dual:
 * 1. Resumen de red (sin itinerario): Muestra todos los paraderos y corredores
 *    verificados de Chiclayo, permitiendo seleccionar origen/destino tocando el mapa.
 * 2. Itinerario activo: Dibuja el trazado preciso, tramos peatonales (cian discontinuo),
 *    viaje en combi (línea sólida con color de ruta) y marcadores visuales (A, 🚐, 🛑, 🏁).
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Itinerary } from '@/routing/format';
import { ACTIVE_PROVIDER } from './MapProvider';
import { MAP_ATTRIBUTION_OSM } from './attribution';
import type { Catalog, Stop } from '@/catalog/types';

interface MapViewProps {
  itinerary?: Itinerary | null;
  catalog?: Catalog;
  height?: string;
  onSelectStop?: (stop: Stop, role: 'origin' | 'destination') => void;
}

// Auto-ajuste de límites cuando cambian los puntos
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

// Marcadores personalizados con divIcon
const originIcon = L.divIcon({
  className: 'custom-pin pin-origin',
  html: '<span>A</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const destIcon = L.divIcon({
  className: 'custom-pin pin-dest',
  html: '<span>🏁</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const boardIcon = L.divIcon({
  className: 'custom-pin pin-board',
  html: '<span>🚐</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const alightIcon = L.divIcon({
  className: 'custom-pin pin-alight',
  html: '<span>🛑</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const catalogStopIcon = L.divIcon({
  className: 'custom-pin pin-stop-network',
  html: '<div class="pin-inner-stop"><span>🚏</span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

interface RouteSegmentVisual {
  type: 'walk' | 'ride' | 'network';
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
  stopRef?: Stop;
}

export function MapView({
  itinerary,
  catalog,
  height = '100%',
  onSelectStop,
}: MapViewProps) {
  const { polylines, markers, bounds, defaultCenter, defaultZoom } = useMemo(() => {
    const lines: RouteSegmentVisual[] = [];
    const markerList: MapMarker[] = [];
    const allCoords: [number, number][] = [];

    // CASO 1: Hay un itinerario activo seleccionado
    if (itinerary && itinerary.steps && itinerary.steps.length > 0) {
      const steps = itinerary.steps;
      const firstStep = steps[0];
      const lastStep = steps[steps.length - 1];

      if (firstStep && firstStep.fromStop) {
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

      if (lastStep && lastStep.toStop) {
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

          if (step.fromStop) {
            linePts.push([step.fromStop.lat, step.fromStop.lon]);
            allCoords.push([step.fromStop.lat, step.fromStop.lon]);

            const isOrigin = step.fromStop.id === firstStep?.fromStop?.id && firstStep.type !== 'walk';
            const cue = step.boardingTip || step.boardingNote || step.fromStop.landmarkContext;
            markerList.push({
              id: `board-${step.fromStop.id}-${i}`,
              title: `Subir a ${step.route?.label ?? 'Transporte'}`,
              subtitle: cue,
              lat: step.fromStop.lat,
              lon: step.fromStop.lon,
              type: isOrigin ? 'origin' : 'board',
            });
          }

          if (step.segment?.geometry && step.segment.geometry.length > 0) {
            for (const pt of step.segment.geometry) {
              linePts.push(pt);
              allCoords.push(pt);
            }
          }

          if (step.toStop) {
            linePts.push([step.toStop.lat, step.toStop.lon]);
            allCoords.push([step.toStop.lat, step.toStop.lon]);

            const isDest = step.toStop.id === lastStep?.toStop?.id;
            if (!isDest) {
              const cue = step.alightingTip || step.alightingNote || step.toStop.landmarkContext;
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
    } else if (catalog) {
      // CASO 2: Sin itinerario seleccionado -> Dibujar toda la red verificada de Chiclayo
      const stopsMap = new Map<string, Stop>();
      for (const stop of catalog.stops) {
        stopsMap.set(stop.id, stop);
        markerList.push({
          id: `net-stop-${stop.id}`,
          title: stop.publicName,
          subtitle: stop.landmarkContext,
          lat: stop.lat,
          lon: stop.lon,
          type: 'stop',
          stopRef: stop,
        });
        allCoords.push([stop.lat, stop.lon]);
      }

      // Dibujar los segmentos del catálogo
      const routeColorMap: Record<string, string> = {};
      for (const r of catalog.routes) {
        routeColorMap[r.id] = r.routeColor || '#f97316';
      }

      for (const seg of catalog.segments) {
        const from = stopsMap.get(seg.fromStopId);
        const to = stopsMap.get(seg.toStopId);
        if (!from || !to) continue;

        const pts: [number, number][] = [[from.lat, from.lon]];
        if (seg.geometry && seg.geometry.length > 0) {
          pts.push(...seg.geometry);
        }
        pts.push([to.lat, to.lon]);

        lines.push({
          type: 'network',
          points: pts,
          color: routeColorMap[seg.routeId] || '#f59e0b',
          weight: 4,
        });
      }
    }

    // Deduplicar marcadores
    const uniqueMarkers: MapMarker[] = [];
    const seenPos = new Set<string>();
    const typePriority: Record<string, number> = { origin: 5, dest: 4, board: 3, alight: 2, stop: 1 };
    markerList.sort((a, b) => (typePriority[b.type] || 0) - (typePriority[a.type] || 0));

    for (const m of markerList) {
      const key = `${m.lat.toFixed(5)},${m.lon.toFixed(5)}`;
      if (!seenPos.has(key)) {
        seenPos.add(key);
        uniqueMarkers.push(m);
      }
    }

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
      defaultZoom: itinerary ? 14 : 13,
    };
  }, [itinerary, catalog]);

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
        return catalogStopIcon;
    }
  };

  return (
    <div className="map-wrapper" style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        aria-label="Mapa de la red de transporte verificado de Chiclayo"
      >
        <TileLayer
          url={ACTIVE_PROVIDER.url}
          attribution={ACTIVE_PROVIDER.attribution}
          maxZoom={ACTIVE_PROVIDER.maxZoom}
        />

        {/* Auto-ajuste de límites */}
        <MapBoundsUpdater bounds={bounds} />

        {/* Polylines de rutas */}
        {polylines.map((poly, idx) => (
          <Polyline
            key={idx}
            positions={poly.points}
            pathOptions={{
              color: poly.color,
              weight: poly.weight,
              dashArray: poly.dashArray,
              opacity: poly.type === 'network' ? 0.75 : 0.95,
            }}
          />
        ))}

        {/* Marcadores con popups interactivos */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lon]}
            icon={getMarkerIcon(m.type)}
          >
            <Popup>
              <div className="map-popup-card">
                <strong className="popup-title">{m.title}</strong>
                {m.subtitle && (
                  <span className="popup-subtitle">📍 {m.subtitle}</span>
                )}
                {/* Si estamos en modo explorador y hay callback para seleccionar paradero */}
                {m.stopRef && onSelectStop && (
                  <div className="popup-actions-row">
                    <button
                      type="button"
                      className="btn-popup-select origin"
                      onClick={() => onSelectStop(m.stopRef!, 'origin')}
                    >
                      🟢 Salir desde aquí
                    </button>
                    <button
                      type="button"
                      className="btn-popup-select dest"
                      onClick={() => onSelectStop(m.stopRef!, 'destination')}
                    >
                      🏁 Ir hacia aquí
                    </button>
                  </div>
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
