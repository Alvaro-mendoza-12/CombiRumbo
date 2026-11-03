/**
 * Pantalla de búsqueda de CombiRumbo Chiclayo (Diseño Citymapper / Transit App).
 * - Dock de transporte conectado (Origen 🟢 y Destino 🏁) con Swap central (⇅).
 * - Chips de prueba rápida (1-click) para demostración inmediata ante jueces.
 * - Modal bottom-sheet con filtro por categorías y buscador en tiempo real.
 * - Geolocalización opcional local protegida por el radio de Chiclayo.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { useSearch } from './searchModel';
import { requestLocation, type GeoError } from './geolocation';
import type { Lang, TFunc } from '@/accessibility/i18n';
import type { LandmarkCategory, Stop } from '@/catalog/types';

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

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-foco en el buscador al abrir el selector
  useEffect(() => {
    if (pickerTarget && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [pickerTarget]);

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

  // Selección rápida de rutas preconfiguradas para evaluadores / jueces
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

  const availableStopsForPicker = useMemo(() => {
    if (pickerTarget === 'origin') {
      return search.availableOrigins;
    }
    if (pickerTarget === 'destination') {
      return search.availableDestinations;
    }
    return [];
  }, [pickerTarget, search.availableOrigins, search.availableDestinations]);

  const filteredStops = useMemo(() => {
    return availableStopsForPicker.filter((stop: Stop) => {
      const matchesCategory =
        selectedCategory === 'all' || stop.category === selectedCategory;
      const q = pickerFilter.toLowerCase().trim();
      const matchesQuery =
        !q ||
        stop.publicName.toLowerCase().includes(q) ||
        (stop.landmarkContext && stop.landmarkContext.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [availableStopsForPicker, selectedCategory, pickerFilter]);

  const handleSelectStop = (stop: Stop) => {
    if (pickerTarget === 'origin') {
      search.selectOrigin(stop);
    } else if (pickerTarget === 'destination') {
      search.selectDestination(stop);
    }
    setPickerTarget(null);
    setPickerFilter('');
    setSelectedCategory('all');
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

  const originStopObj = useMemo(() => {
    return search.availableOrigins.find((s: Stop) => s.id === search.originStopId) ||
      search.availableDestinations.find((s: Stop) => s.id === search.originStopId);
  }, [search.originStopId, search.availableOrigins, search.availableDestinations]);

  const destStopObj = useMemo(() => {
    return search.availableDestinations.find((s: Stop) => s.id === search.destinationStopId) ||
      search.availableOrigins.find((s: Stop) => s.id === search.destinationStopId);
  }, [search.destinationStopId, search.availableDestinations, search.availableOrigins]);

  return (
    <div className="search-view-container">
      {/* 1. Chips de Acceso Rápido para Demostración */}
      <div className="quick-demo-container">
        <div className="quick-demo-header">
          <span>⚡ Rutas verificadas para prueba rápida:</span>
        </div>
        <div className="quick-chips-scroll">
          <button
            type="button"
            className="quick-demo-chip"
            onClick={() => handleQuickSelect('stop-ovalo-santa-victoria', 'stop-usmp-campus-chiclayo')}
          >
            <span className="chip-badge">🚐 Combi</span>
            <span className="chip-title">Santa Victoria ➔ USMP</span>
          </button>

          <button
            type="button"
            className="quick-demo-chip"
            onClick={() => handleQuickSelect('stop-parque-principal', 'stop-balneario-pimentel')}
          >
            <span className="chip-badge beach">🌊 Playa</span>
            <span className="chip-title">Centro ➔ Pimentel</span>
          </button>

          <button
            type="button"
            className="quick-demo-chip"
            onClick={() => handleQuickSelect('stop-mercado-modelo', 'stop-mercado-moshoqueque')}
          >
            <span className="chip-badge linea10">🚌 Línea 10</span>
            <span className="chip-title">Modelo ➔ Moshoqueque</span>
          </button>

          <button
            type="button"
            className="quick-demo-chip"
            onClick={() => handleQuickSelect('stop-parque-principal', 'stop-mercado-central')}
          >
            <span className="chip-badge walk">🚶 A pie</span>
            <span className="chip-title">Parque ➔ Mercado (&lt;280m)</span>
          </button>
        </div>
      </div>

      {/* 2. Dock de Conexión de Paraderos */}
      <form className="transit-dock-form" onSubmit={handleSearchSubmit}>
        <div className="dock-inputs-wrapper">
          {/* Línea conectora visual */}
          <div className="dock-connector-line" aria-hidden="true">
            <span className="dot dot-origin" />
            <span className="line-segment" />
            <span className="dot dot-dest" />
          </div>

          <div className="dock-fields-column">
            {/* Campo de Origen */}
            <div className="dock-field">
              <label htmlFor="origin-trigger" id="origin-label" className="dock-field-label">
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
                    {originStopObj?.landmarkContext && (
                      <span className="selector-sub-text">
                        {originStopObj.landmarkContext}
                      </span>
                    )}
                  </div>
                </div>
                <span className="selector-arrow" aria-hidden="true">▾</span>
              </button>
            </div>

            {/* Campo de Destino */}
            <div className="dock-field">
              <label htmlFor="dest-trigger" id="dest-label" className="dock-field-label">
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
                    {destStopObj?.landmarkContext && (
                      <span className="selector-sub-text">
                        {destStopObj.landmarkContext}
                      </span>
                    )}
                  </div>
                </div>
                <span className="selector-arrow" aria-hidden="true">▾</span>
              </button>
            </div>
          </div>

          {/* Botón flotante Swap (Invertir) */}
          <div className="dock-swap-container">
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

        {/* Alerta de origen y destino idénticos */}
        {isSameLocation && (
          <div className="alert-box" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠️</span>
            <span>{t('search.sameLocationError')}</span>
          </div>
        )}

        {/* Indicador de GPS Activo */}
        {search.isUsingGpsOrigin && (
          <div className="alert-box info" role="status">
            <span aria-hidden="true">📍</span>
            <div style={{ flex: 1 }}>
              <strong>{t('search.locationActive')}</strong>
              {search.nearStopName && (
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
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

        {/* Botones de Acción */}
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
              <span>📍 {t('search.useLocation')}</span>
            )}
          </button>
        </div>

        {/* Errores de Georreferenciación */}
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
          {t('search.locationHint')} · {t('app.privacyNote')}
        </p>
      </form>

      {/* Modal Bottom-Sheet para Selección de Paraderos */}
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
                {pickerTarget === 'origin'
                  ? t('search.originLabel')
                  : t('search.destinationLabel')}
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

            {/* Input de filtro dentro del modal */}
            <input
              ref={searchInputRef}
              type="text"
              className="picker-search-input"
              placeholder={t('search.searchInList')}
              value={pickerFilter}
              onChange={(e) => setPickerFilter(e.target.value)}
              autoComplete="off"
            />

            {/* Chips de filtro por categorías */}
            <div className="category-chips-row" role="group" aria-label="Categorías">
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                {t('search.categoryAll')}
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'university' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('university')}
              >
                {t('search.categoryUniversity')}
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'market' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('market')}
              >
                {t('search.categoryMarket')}
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'beach' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('beach')}
              >
                {t('search.categoryBeach')}
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'center' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('center')}
              >
                {t('search.categoryCenter')}
              </button>
              <button
                type="button"
                className={`category-chip ${selectedCategory === 'health' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('health')}
              >
                {t('search.categoryHealth')}
              </button>
            </div>

            {/* Lista de paraderos */}
            <div className="stops-list-scroll">
              {filteredStops.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron paraderos en esta categoría.
                </div>
              ) : (
                filteredStops.map((stop: Stop) => (
                  <button
                    key={stop.id}
                    type="button"
                    className="stop-item-btn"
                    onClick={() => handleSelectStop(stop)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="stop-item-name">{stop.publicName}</span>
                      {stop.category && (
                        <span className="stop-item-cat-badge">
                          {stop.category}
                        </span>
                      )}
                    </div>
                    {stop.landmarkContext && (
                      <span className="stop-item-context">
                        📍 {stop.landmarkContext}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
