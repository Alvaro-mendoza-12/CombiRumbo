/**
 * Pantalla de búsqueda inteligente de CombiRumbo (Google Maps / Citymapper Style).
 * - Dock de transporte conectado (Origen 🟢 y Destino 🏁) con Swap animado (⇅).
 * - Buscador híbrido de POIs (Universidades USMP, USS, USAT, UNPRG, Hospitales, Malls).
 * - Integración con Copilot IA (OpenRouter) para consultas en lenguaje natural.
 * - Chips de prueba rápida de 1-clic para jurados y pasajeros.
 * - Manejo transparente y honesto de destinos fuera de cobertura.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { useSearch } from './searchModel';
import { requestLocation, type GeoError } from './geolocation';
import type { Lang, TFunc } from '@/accessibility/i18n';
import type { LandmarkCategory, Place } from '@/catalog/types';
import { searchPlaces } from './geocoder';
import { CHICLAYO_PLACES } from './places';
import { askTransitAssistant, type AssistantResponse } from '@/ai/assistant';

interface SearchViewProps {
  search: ReturnType<typeof useSearch>;
  catalog?: import('@/catalog/types').Catalog;
  empty: boolean;
  online: boolean;
  lang: Lang;
  t: TFunc;
  onSearch: (fromId: string, toId: string) => void;
}

type PickerTarget = 'origin' | 'destination' | null;

export function SearchView({
  search,
  catalog,
  empty,
  t,
  onSearch,
}: SearchViewProps) {
  const [geoError, setGeoError] = useState<GeoError | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerFilter, setPickerFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LandmarkCategory | 'all'>('all');
  const [swapRotating, setSwapRotating] = useState(false);

  // Lugares obtenidos por geocodificación
  const [geocodedPlaces, setGeocodedPlaces] = useState<Place[]>(CHICLAYO_PLACES);

  // Estado del Asistente Copilot IA
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<AssistantResponse | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-foco en el buscador al abrir el selector
  useEffect(() => {
    if (pickerTarget && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [pickerTarget]);

  // Actualizar lugares cuando el usuario escribe en el selector (con debouncing)
  useEffect(() => {
    let active = true;
    const cityId = catalog?.cityId || 'chiclayo';

    if (!pickerFilter.trim()) {
      setGeocodedPlaces(CHICLAYO_PLACES.filter(p => p.cityId === cityId));
      return;
    }

    const timer = setTimeout(async () => {
      const places = await searchPlaces(pickerFilter, { cityId, limit: 10 });
      if (active) {
        setGeocodedPlaces(places);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pickerFilter, catalog?.cityId]);

  // Manejar geolocalización segura
  const handleLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError(null);
    const result = await requestLocation(search.graph);
    setGeoLoading(false);

    if (!result.ok) {
      setGeoError(result.error ?? 'unavailable');
      return;
    }

    if (result.result && result.result.stop) {
      search.setCustomOriginLocation(
        { lat: result.result.lat, lon: result.result.lon },
        result.result.stop.id
      );
    }
  }, [search]);

  // Invertir origen y destino
  const handleSwap = useCallback(() => {
    setSwapRotating(true);
    search.swapStops();
    setTimeout(() => setSwapRotating(false), 300);
  }, [search]);

  // Selección rápida de rutas preconfiguradas para jurados / pasajeros
  const handleQuickSelect = useCallback((fromId: string, toId: string) => {
    if (!catalog) return;
    const fromStop = catalog.stops.find(s => s.id === fromId);
    const toStop = catalog.stops.find(s => s.id === toId);
    if (fromStop && toStop) {
      search.selectOrigin(fromStop);
      search.selectDestination(toStop);
      onSearch(fromId, toId);
    }
  }, [catalog, search, onSearch]);

  // Enviar búsqueda
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!search.originStopId || !search.destinationStopId) return;
      if (search.originStopId === search.destinationStopId) return;
      onSearch(search.originStopId, search.destinationStopId);
    },
    [search.originStopId, search.destinationStopId, onSearch]
  );

  // Filtrado de lugares en el selector
  const filteredPlaces = useMemo(() => {
    return geocodedPlaces.filter((place: Place) => {
      if (selectedCategory !== 'all' && place.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [geocodedPlaces, selectedCategory]);

  const handleSelectPlace = (place: Place) => {
    if (pickerTarget === 'origin') {
      search.selectOriginPlace(place);
    } else if (pickerTarget === 'destination') {
      search.selectDestinationPlace(place);
    }
    setPickerTarget(null);
    setPickerFilter('');
    setSelectedCategory('all');
  };

  // Enviar consulta al Copilot IA
  const handleAskCopilot = async (customPrompt?: string) => {
    const q = customPrompt || copilotQuery;
    if (!q.trim() || !catalog) return;

    setCopilotLoading(true);
    setCopilotResult(null);
    const res = await askTransitAssistant(q, catalog, catalog.cityId);
    setCopilotLoading(false);
    setCopilotResult(res);
  };

  // Aplicar sugerencia de ruta del Copilot
  const handleApplyCopilotRoute = (originId?: string, destId?: string) => {
    if (!originId || !destId || !catalog) return;
    const fromStop = catalog.stops.find(s => s.id === originId);
    const toStop = catalog.stops.find(s => s.id === destId);
    if (fromStop && toStop) {
      search.selectOrigin(fromStop);
      search.selectDestination(toStop);
      setShowCopilot(false);
      onSearch(originId, destId);
    }
  };

  const isSameLocation = Boolean(
    search.originStopId &&
    search.destinationStopId &&
    search.originStopId === search.destinationStopId
  );

  const canSubmit = Boolean(
    search.originStopId &&
    search.destinationStopId &&
    !isSameLocation &&
    !empty
  );

  return (
    <div className="search-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Barra de Prueba Rápida (1-Click para Jueces) */}
      <div className="quick-demo-section">
        <div className="quick-demo-title">
          <span>⚡ Rutas verificadas para prueba rápida:</span>
        </div>
        <div className="quick-chips-row">
          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickSelect('stop-ovalo-santa-victoria', 'stop-usmp-campus-chiclayo')}
          >
            <span className="chip-tag combi">🚐 Combi</span>
            <span className="chip-label">Santa Victoria ➔ USMP</span>
          </button>

          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickSelect('stop-parque-principal', 'stop-balneario-pimentel')}
          >
            <span className="chip-tag beach">🌊 Playa</span>
            <span className="chip-label">Centro ➔ Pimentel</span>
          </button>

          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickSelect('stop-mercado-modelo', 'stop-mercado-moshoqueque')}
          >
            <span className="chip-tag linea10">🚌 Línea 10</span>
            <span className="chip-label">Modelo ➔ Moshoqueque</span>
          </button>

          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickSelect('stop-parque-principal', 'stop-mercado-central')}
          >
            <span className="chip-tag walk">🚶 A pie</span>
            <span className="chip-label">Parque ➔ Mercado (&lt;280m)</span>
          </button>
        </div>
      </div>

      {/* 2. Dock de Transporte Conectado */}
      <form className="transit-dock-form" onSubmit={handleSearchSubmit}>
        <div className="transit-dock-card">
          {/* Línea conectora visual */}
          <div className="dock-line-visual" aria-hidden="true">
            <span className="dock-dot origin" />
            <span className="dock-line-dashed" />
            <span className="dock-dot dest" />
          </div>

          <div className="dock-fields-box">
            {/* Origen */}
            <div className="dock-input-field">
              <label htmlFor="origin-trigger" id="origin-label" className="dock-label">
                {t('search.originLabel')}
              </label>
              <button
                type="button"
                id="origin-trigger"
                aria-labelledby="origin-label"
                className="stop-selector-btn"
                onClick={() => setPickerTarget('origin')}
              >
                <div className="selector-content">
                  <span className="selector-icon" aria-hidden="true">🟢</span>
                  <div className="selector-text">
                    <span className={`selector-main-text ${!search.originQuery ? 'placeholder' : ''}`}>
                      {search.originQuery || t('search.originPlaceholder')}
                    </span>
                  </div>
                </div>
                <span className="selector-arrow" aria-hidden="true">▾</span>
              </button>
            </div>

            {/* Destino */}
            <div className="dock-input-field">
              <label htmlFor="dest-trigger" id="dest-label" className="dock-label">
                {t('search.destinationLabel')}
              </label>
              <button
                type="button"
                id="dest-trigger"
                aria-labelledby="dest-label"
                className="stop-selector-btn"
                onClick={() => setPickerTarget('destination')}
              >
                <div className="selector-content">
                  <span className="selector-icon" aria-hidden="true">🏁</span>
                  <div className="selector-text">
                    <span className={`selector-main-text ${!search.destinationQuery ? 'placeholder' : ''}`}>
                      {search.destinationQuery || t('search.destinationPlaceholder')}
                    </span>
                  </div>
                </div>
                <span className="selector-arrow" aria-hidden="true">▾</span>
              </button>
            </div>
          </div>

          {/* Botón flotante Swap */}
          <div className="dock-swap-wrap">
            <button
              type="button"
              className={`btn-dock-swap ${swapRotating ? 'rotating' : ''}`}
              onClick={handleSwap}
              aria-label={t('search.swap')}
              title={t('search.swap')}
            >
              <span aria-hidden="true">⇅</span>
            </button>
          </div>
        </div>

        {/* Alerta de destino no cubierto (honestidad de datos) */}
        {search.state === 'uncovered-destination' && search.uncoveredInfo && (
          <div className="alert-box warning" role="alert">
            <span aria-hidden="true">⚠️</span>
            <div style={{ flex: 1 }}>
              <strong>Destino fuera del corredor piloto:</strong>
              <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                Detectamos <em>{search.uncoveredInfo.placeName}</em>. El paradero verificado más próximo es{' '}
                <strong>{search.uncoveredInfo.nearestStopName}</strong> (a {search.uncoveredInfo.distanceKm} km). CombiRumbo no inventa rutas hasta contar con verificación de campo.
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '6px', fontSize: '0.75rem', padding: '4px 8px', minHeight: '32px' }}
                onClick={() => onSearch(search.originStopId || 'stop-parque-principal', search.destinationStopId!)}
              >
                Ver ruta hasta {search.uncoveredInfo.nearestStopName} →
              </button>
            </div>
          </div>
        )}

        {/* Alerta de origen y destino idénticos */}
        {isSameLocation && (
          <div className="alert-box" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠️</span>
            <span>{t('search.sameLocationError')}</span>
          </div>
        )}

        {/* Estado de GPS Activo */}
        {search.isUsingGpsOrigin && (
          <div className="alert-box info" role="status">
            <span aria-hidden="true">📍</span>
            <div style={{ flex: 1 }}>
              <strong>{t('search.locationActive')}</strong>
              {search.nearStopName && (
                <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                  {t('search.locationNear', {
                    stop: search.nearStopName,
                    dist: search.nearDistanceMeters ?? 0,
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-text-tiny"
              onClick={search.clearCustomOrigin}
              aria-label="Quitar GPS"
            >
              ✕
            </button>
          </div>
        )}

        {/* Fila de Botones: Buscar y GPS */}
        <div className="search-actions-row">
          <button
            type="submit"
            className="btn-primary"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            <span>🔍 {t('search.button')}</span>
          </button>

          <button
            type="button"
            className={`btn-location ${search.isUsingGpsOrigin ? 'active' : ''}`}
            onClick={handleLocation}
            disabled={geoLoading || empty}
            aria-label={t('search.useLocation')}
          >
            {geoLoading ? (
              <span>⏳ {t('search.locating')}</span>
            ) : (
              <span>📍 GPS</span>
            )}
          </button>
        </div>

        {/* Acceso directo al Asistente IA */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-copilot-pill"
            onClick={() => setShowCopilot(true)}
            style={{ width: '100%', justifyContent: 'center', padding: '8px 12px' }}
          >
            ✨ ¿Tienes dudas? Pregúntale a Copilot IA en lenguaje natural
          </button>
        </div>

        {/* Errores de GPS */}
        {geoError && (
          <div className="alert-box" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠️</span>
            <span>
              {geoError === 'out-of-bounds'
                ? t('search.locationOutOfBounds')
                : geoError === 'denied'
                ? t('search.locationDenied')
                : geoError === 'empty-catalog'
                ? t('search.locationEmpty')
                : t('search.locationUnavailable')}
            </span>
          </div>
        )}

        <p className="privacy-note">
          {t('search.locationHint')}
        </p>
      </form>

      {/* MODAL 1: Selector de Destinos y POIs con Autocompletado */}
      {pickerTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="picker-title"
          onClick={() => setPickerTarget(null)}
        >
          <div
            className="stop-picker-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="picker-header">
              <h3 id="picker-title">
                {pickerTarget === 'origin' ? t('search.originLabel') : t('search.destinationLabel')}
              </h3>
              <button
                type="button"
                className="picker-close"
                onClick={() => setPickerTarget(null)}
                aria-label={t('search.closePicker')}
              >
                ✕
              </button>
            </div>

            {/* Input de búsqueda en tiempo real con icono integrado */}
            <div className="picker-search-container">
              <span className="picker-search-icon" aria-hidden="true">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                className="picker-search-input"
                placeholder="Escribe USMP, USS, USAT, Real Plaza, Hospital..."
                value={pickerFilter}
                onChange={(e) => setPickerFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setPickerTarget(null);
                }}
                autoComplete="off"
              />
            </div>

            {/* Chips de filtro por categorías */}
            <div className="category-chips-row" role="group" aria-label="Categorías">
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'university' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('university')}
              >
                🎓 Universidades
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'health' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('health')}
              >
                🏥 Hospitales
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'market' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('market')}
              >
                🛒 Malls / Mercados
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'beach' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('beach')}
              >
                🌊 Playas
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'center' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('center')}
              >
                🏛️ Centro
              </button>
            </div>

            {/* Lista de lugares encontrados */}
            <div className="stops-list-scroll">
              {filteredPlaces.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron lugares en esta categoría. Escribe el nombre o dirección arriba.
                </div>
              ) : (
                filteredPlaces.map((place: Place) => (
                  <button
                    key={place.id}
                    type="button"
                    className="place-item-card"
                    onClick={() => handleSelectPlace(place)}
                  >
                    <div className="place-title-row">
                      <span className="place-name">{place.name}</span>
                      <span className={`place-category-pill ${place.category}`}>
                        {place.category}
                      </span>
                    </div>
                    {place.landmarkContext && (
                      <span className="place-context">
                        📍 {place.landmarkContext}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Asistente Inteligente Copilot IA */}
      {showCopilot && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="copilot-title"
          onClick={() => setShowCopilot(false)}
        >
          <div
            className="copilot-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="copilot-header">
              <h3 id="copilot-title" className="copilot-title">
                ✨ CombiRumbo Copilot IA
              </h3>
              <button
                type="button"
                className="picker-close"
                onClick={() => setShowCopilot(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Pregunta en tus propias palabras qué combi tomar o cómo llegar a tu destino en Chiclayo:
            </p>

            {/* Consultas frecuentes rápidas */}
            <div className="copilot-suggestions">
              <button
                type="button"
                className="copilot-prompt-btn"
                onClick={() => {
                  setCopilotQuery('¿Cómo llego a la USMP desde el Óvalo Santa Victoria?');
                  handleAskCopilot('¿Cómo llego a la USMP desde el Óvalo Santa Victoria?');
                }}
              >
                💬 ¿Cómo llego a la USMP desde el Óvalo Santa Victoria?
              </button>
              <button
                type="button"
                className="copilot-prompt-btn"
                onClick={() => {
                  setCopilotQuery('Quiero ir a la playa Pimentel desde el centro');
                  handleAskCopilot('Quiero ir a la playa Pimentel desde el centro');
                }}
              >
                💬 Quiero ir a la playa Pimentel desde el centro
              </button>
              <button
                type="button"
                className="copilot-prompt-btn"
                onClick={() => {
                  setCopilotQuery('¿Cuánto cuesta el pasaje a Pimentel y qué le digo al chofer?');
                  handleAskCopilot('¿Cuánto cuesta el pasaje a Pimentel y qué le digo al chofer?');
                }}
              >
                💬 ¿Cuánto cuesta el pasaje a Pimentel y qué le digo al chofer?
              </button>
            </div>

            {/* Formulario de consulta */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="picker-search-input"
                style={{ marginBottom: 0 }}
                placeholder="Escribe tu consulta aquí..."
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskCopilot();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 16px', minHeight: '44px' }}
                onClick={() => handleAskCopilot()}
                disabled={copilotLoading || !copilotQuery.trim()}
              >
                {copilotLoading ? '...' : 'Enviar'}
              </button>
            </div>

            {/* Respuesta del Copilot */}
            {copilotLoading && (
              <div style={{ textAlign: 'center', padding: '16px', color: '#d8b4fe' }}>
                ⏳ Consultando red verificada con OpenRouter IA...
              </div>
            )}

            {copilotResult && (
              <div className="copilot-answer-card">
                <div style={{ marginBottom: '8px' }}>
                  {copilotResult.conversationalAnswer}
                </div>

                {copilotResult.tips && copilotResult.tips.length > 0 && (
                  <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: '#fde68a' }}>
                    {copilotResult.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                )}

                {copilotResult.suggestedOriginStopId && copilotResult.suggestedDestinationStopId && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: '10px', width: '100%', fontSize: '0.85rem' }}
                    onClick={() => handleApplyCopilotRoute(
                      copilotResult.suggestedOriginStopId,
                      copilotResult.suggestedDestinationStopId
                    )}
                  >
                    🗺️ Trazar esta ruta en el mapa →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
