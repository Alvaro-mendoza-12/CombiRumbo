/**
 * CombiRumbo - Guía Verificada de Transporte Público
 * Arquitectura Map-First internacional (Google Maps / Citymapper UX)
 *
 * Características principales:
 * - Mapa full-canvas permanente en 100% de pantalla con Leaflet
 * - Floating Transit Hub: Tarjeta flotante en escritorio, Bottom Sheet nativo en móvil
 * - Soporte multi-ciudad internacional (Chiclayo activo, Lima, Bogotá, CDMX, BsAs en roadmap)
 * - Geocodificador híbrido y directorio exhaustivo de destinos/universidades de Chiclayo
 * - Asistente IA de Transporte (OpenRouter) contextualizado con datos verificados
 * - Protocolo de honestidad radical: sin inventar rutas ni tarifas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from './accessibility/i18n';
import { useOnlineStatus } from './pwa/offline';
import { loadCatalog, isCatalogEmpty } from './catalog/catalog';
import { saveCatalogToCache, getCachedSyncDate, loadCachedCatalog } from './pwa/cache';
import { EMPTY_CATALOG, type Catalog, type Stop, type CityConfig } from './catalog/types';
import { CHICLAYO_CITY_CONFIG, SUPPORTED_CITIES_LIST } from './catalog/config';
import { useSearch } from './search/searchModel';
import { SearchView } from './search/SearchView';
import { ResultsView } from './search/ResultsView';
import { DetailView } from './search/DetailView';
import { MapView } from './map/MapView';
import { VisuallyHidden } from './accessibility/VisuallyHidden';

type View = 'search' | 'results' | 'detail';

export default function App() {
  const { t, lang, setLang } = useI18n();
  const online = useOnlineStatus();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [syncDate, setSyncDate] = useState<string | null>(null);
  const [view, setView] = useState<View>('search');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  // Estado de ciudad activa (Chiclayo piloto único activo)
  const [activeCity, setActiveCity] = useState<CityConfig>(CHICLAYO_CITY_CONFIG);
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Estado para centrado dinámico del mapa
  const [mapCenterOverride, setMapCenterOverride] = useState<[number, number] | null>(null);

  // Notificación de detección automática de país / ciudad
  const [detectionToast, setDetectionToast] = useState<string | null>(null);

  // En móvil: colapsar a vista reducida o desplegar a pantalla completa
  const [mobileSheetCollapsed, setMobileSheetCollapsed] = useState(false);

  // Auto-detección inteligente del país / ciudad del dispositivo
  useEffect(() => {
    let timer: NodeJS.Timeout | number;

    // 1. Detección rápida y sin permisos vía huso horario / locale del dispositivo
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Bogota')) {
        const bogota = SUPPORTED_CITIES_LIST.find(c => c.id === 'bogota');
        if (bogota) {
          setActiveCity(bogota);
          setMapCenterOverride([...bogota.boundingCenter]);
          setDetectionToast(`📍 Ubicación detectada: Bogotá, Colombia. Red asignada automáticamente.`);
          timer = setTimeout(() => setDetectionToast(null), 6000);
          return;
        }
      } else if (tz.includes('Mexico') || tz.includes('Monterrey') || tz.includes('Cancun') || tz.includes('Tijuana')) {
        const cdmx = SUPPORTED_CITIES_LIST.find(c => c.id === 'cdmx');
        if (cdmx) {
          setActiveCity(cdmx);
          setMapCenterOverride([...cdmx.boundingCenter]);
          setDetectionToast(`📍 Ubicación detectada: Ciudad de México. Red asignada automáticamente.`);
          timer = setTimeout(() => setDetectionToast(null), 6000);
          return;
        }
      } else if (tz.includes('Buenos_Aires') || tz.includes('Cordoba') || tz.includes('Mendoza') || tz.includes('Argentina')) {
        const bsas = SUPPORTED_CITIES_LIST.find(c => c.id === 'buenosaires');
        if (bsas) {
          setActiveCity(bsas);
          setMapCenterOverride([...bsas.boundingCenter]);
          setDetectionToast(`📍 Ubicación detectada: Buenos Aires, Argentina. Red asignada automáticamente.`);
          timer = setTimeout(() => setDetectionToast(null), 6000);
          return;
        }
      }
    } catch {
      // Continuar con fallback por geolocalización
    }

    // 2. Si hay coordenadas GPS autorizadas en el navegador, asociar a la ciudad más cercana
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLon = pos.coords.longitude;

          let closest = CHICLAYO_CITY_CONFIG;
          let minD = Infinity;

          for (const c of SUPPORTED_CITIES_LIST) {
            const d = Math.hypot(c.boundingCenter[0] - uLat, c.boundingCenter[1] - uLon);
            if (d < minD) {
              minD = d;
              closest = c;
            }
          }

          if (closest.id !== 'chiclayo') {
            setActiveCity(closest);
            setMapCenterOverride([...closest.boundingCenter]);
            setDetectionToast(`📍 Ubicación detectada cerca de ${closest.name} (${closest.country}). Red asignada.`);
            timer = setTimeout(() => setDetectionToast(null), 6000);
          }
        },
        () => {},
        { timeout: 3000, maximumAge: 300000 }
      );
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Cargar catálogo de rutas verificadas
  useEffect(() => {
    async function loadCatalogData() {
      try {
        const response = await fetch('/data/recorridos-verificados.json');
        if (response.ok) {
          const raw = await response.json();
          const { catalog: loaded } = loadCatalog(raw);
          setCatalog(loaded);
          saveCatalogToCache(loaded);
          setSyncDate(new Date().toISOString());
        } else {
          throw new Error('No se pudo cargar el catálogo');
        }
      } catch {
        const cached = loadCachedCatalog();
        setCatalog(cached);
        setSyncDate(getCachedSyncDate());
      }
    }
    loadCatalogData();
  }, []);

  const search = useSearch(catalog ?? EMPTY_CATALOG);

  // Sincronizar fecha de caché cuando hay catálogo
  const effectiveSyncDate = useMemo(() => {
    return online ? syncDate : getCachedSyncDate();
  }, [online, syncDate]);

  const handleSearch = useCallback(
    (fromId: string, toId: string) => {
      search.search(fromId, toId);
      setView('results');
      setMobileSheetCollapsed(false);
    },
    [search]
  );

  const handleSelectItinerary = useCallback((itineraryId: string) => {
    setSelectedItineraryId(itineraryId);
    setView('detail');
    setMobileSheetCollapsed(false);
  }, []);

  const handleBack = useCallback(() => {
    setView('results');
  }, []);

  const handleNewSearch = useCallback(() => {
    search.reset();
    setSelectedItineraryId(null);
    setView('search');
  }, [search]);

  // Selección directa desde los pines del mapa interactivo
  const handleSelectStopFromMap = useCallback((stop: Stop, role: 'origin' | 'destination') => {
    if (role === 'origin') {
      search.selectOrigin(stop);
    } else {
      search.selectDestination(stop);
    }
    if (view !== 'search') {
      setView('search');
    }
  }, [search, view]);

  // Botón Recentrar en la Ciudad
  const handleRecenterCity = useCallback(() => {
    setMapCenterOverride([...activeCity.boundingCenter]);
    // Limpiar el override después de 1.5s para permitir libre navegación
    setTimeout(() => setMapCenterOverride(null), 1500);
  }, [activeCity]);

  // Manejo de cambio de ciudad internacional
  const handleSelectCity = useCallback((city: CityConfig) => {
    setActiveCity(city);
    setShowCitySelector(false);
    setMapCenterOverride([...city.boundingCenter]);
    setTimeout(() => setMapCenterOverride(null), 1500);
  }, []);

  if (!catalog) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#090e17',
        color: '#f59e0b',
        gap: '12px'
      }}>
        <div style={{ fontSize: '2.5rem', animation: 'bounce 1s infinite' }}>🚐</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          CombiRumbo · Cargando red verificada de transporte...
        </div>
      </div>
    );
  }

  const empty = isCatalogEmpty(catalog);
  const selectedItinerary = search.results.find(i => i.id === selectedItineraryId);
  const activeItinerary = selectedItinerary || (search.results.length > 0 ? search.results[0] : null);

  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido de rutas</a>

      <div className="app-container">
        {/* MAPA FULL-CANVAS LAYER (100% de la pantalla) */}
        <div className="map-canvas-layer">
          <MapView
            catalog={catalog}
            itinerary={view === 'search' ? null : activeItinerary}
            onSelectStop={handleSelectStopFromMap}
            centerOverride={mapCenterOverride}
            height="100%"
          />
        </div>

        {/* Notificación flotante de detección automática de país */}
        {detectionToast && (
          <div className="toast-location-notification" role="status" aria-live="polite">
            <span>{detectionToast}</span>
            <button
              type="button"
              onClick={() => setDetectionToast(null)}
              aria-label="Cerrar notificación de ubicación"
            >
              ✕
            </button>
          </div>
        )}

        {/* CONTROLES FLOTANTES EN EL MAPA (Inferior derecha) */}
        <div className="floating-map-controls" role="toolbar" aria-label="Controles del mapa">
          <button
            type="button"
            className="map-control-btn"
            onClick={handleRecenterCity}
            title={`Centrar mapa en ${activeCity.name}`}
            aria-label={`Centrar mapa en ${activeCity.name}`}
          >
            🎯
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={() => setShowCitySelector(true)}
            title="Seleccionar ciudad / Red de transporte"
            aria-label="Seleccionar ciudad / Red de transporte"
          >
            🌐
          </button>
        </div>

        {/* PANEL FLOTANTE DE TRANSPORTE (Citymapper / Google Maps UX) */}
        <aside
          className={`floating-transit-hub ${mobileSheetCollapsed ? 'sheet-peek' : ''}`}
          id="main-content"
          aria-label="Planificador de viajes CombiRumbo"
        >
          {/* Handle de arrastre para móviles */}
          <div
            className="sheet-drag-handle-bar"
            onClick={() => setMobileSheetCollapsed(!mobileSheetCollapsed)}
            title="Deslizar panel de transporte"
            aria-hidden="true"
          />

          {/* Encabezado Principal del Hub */}
          <header className="hub-header">
            <div className="brand-badge-group">
              <div className="brand-icon-box" aria-hidden="true">🚐</div>
              <div className="brand-text-column">
                <div className="brand-title-row">
                  <span className="brand-name">CombiRumbo</span>
                  <button
                    type="button"
                    className="city-selector-btn"
                    onClick={() => setShowCitySelector(true)}
                    title="Cambiar ciudad"
                  >
                    <span>{activeCity.flag} {activeCity.name}</span>
                    <span style={{ fontSize: '0.65rem' }}>▼</span>
                  </button>
                </div>
                <span className="brand-tagline">{t('app.tagline')}</span>
              </div>
            </div>

            <div className="hub-controls-row">
              {/* Segmented control de idioma */}
              <div className="lang-segmented" role="group" aria-label="Idioma">
                <button
                  type="button"
                  className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
                  onClick={() => setLang('es')}
                  aria-pressed={lang === 'es'}
                >
                  ES
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                >
                  EN
                </button>
              </div>
            </div>
          </header>

          {/* Banner de Ciudad Planificada (si no es Chiclayo) */}
          {activeCity.pilotStatus !== 'active-pilot' && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.14)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: '#fef08a',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <span>🚧 {activeCity.name} ({activeCity.country}): Red en preparación</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>{activeCity.coverageSummary}</div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', alignSelf: 'flex-start', minHeight: '30px' }}
                onClick={() => handleSelectCity(CHICLAYO_CITY_CONFIG)}
              >
                ← Volver al piloto activo de Chiclayo
              </button>
            </div>
          )}

          {/* Banner Offline */}
          {!online && (
            <div className="offline-banner" role="status" aria-live="polite">
              {t('offline.banner')}
            </div>
          )}

          {/* Área con scroll del Hub */}
          <div className="sidebar-scroll-content">
            {view === 'search' && (
              <SearchView
                search={search}
                catalog={catalog}
                empty={empty}
                onSearch={handleSearch}
                online={online}
                lang={lang}
                t={t}
              />
            )}

            {view === 'results' && (
              <ResultsView
                results={search.results}
                state={search.state}
                empty={empty}
                online={online}
                lang={lang}
                t={t}
                onSelectItinerary={handleSelectItinerary}
                onNewSearch={handleNewSearch}
                catalog={catalog}
                uncoveredInfo={search.uncoveredInfo}
                onSelectNearestStop={() => {
                  if (search.originStopId && search.destinationStopId) {
                    search.search(search.originStopId, search.destinationStopId);
                  }
                }}
              />
            )}

            {view === 'detail' && selectedItinerary && (
              <DetailView
                itinerary={selectedItinerary}
                catalog={catalog}
                online={online}
                lang={lang}
                t={t}
                onBack={handleBack}
              />
            )}

            {view === 'detail' && !selectedItinerary && (
              <div className="no-results-card">
                <p>No se encontró el itinerario seleccionado.</p>
                <button type="button" className="btn-secondary" onClick={handleBack}>
                  {t('detail.back')}
                </button>
              </div>
            )}
          </div>

          {/* Pie de transparencia y metodología */}
          <footer className="sidebar-footer">
            <details>
              <summary>{t('disclaimer.title')}</summary>
              <p style={{ marginTop: '6px', lineHeight: 1.4 }}>{t('disclaimer.body')}</p>
              {effectiveSyncDate && (
                <div style={{ marginTop: '4px', color: '#94a3b8' }}>
                  {t('offline.syncDate', {
                    date: new Date(effectiveSyncDate).toLocaleDateString(
                      lang === 'es' ? 'es-PE' : 'en-US',
                      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                    ),
                  })}
                </div>
              )}
            </details>
          </footer>
        </aside>

        {/* MODAL SELECTOR DE CIUDAD INTERNACIONAL */}
        {showCitySelector && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setShowCitySelector(false)}
          >
            <div className="city-modal-box" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  🌐 {lang === 'es' ? 'Ciudades y Redes de Transporte' : 'Cities & Transit Networks'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCitySelector(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}
                  aria-label="Cerrar modal de ciudades"
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {lang === 'es'
                  ? 'CombiRumbo está diseñado para expandirse a cualquier ciudad con transporte informal o tradicional mediante datos verificados en campo.'
                  : 'CombiRumbo is built to scale across cities with informal or traditional transit using verified field observations.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SUPPORTED_CITIES_LIST.map((city) => {
                  const isActive = city.id === activeCity.id;
                  const isPilot = city.pilotStatus === 'active-pilot';
                  return (
                    <button
                      key={city.id}
                      type="button"
                      className={`city-option-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectCity(city)}
                    >
                      <div className="city-info-col">
                        <div className="city-title-row">
                          <span style={{ fontSize: '1.3rem' }}>{city.flag}</span>
                          <span>{city.name}</span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({city.country})</span>
                        </div>
                        <div className="city-meta-text">
                          {city.transportModes.join(' · ')} · Moneda: {city.currency} ({city.currencySymbol})
                        </div>
                      </div>

                      <span className={`city-status-badge ${city.pilotStatus}`}>
                        {isPilot ? '✅ EN VIVO' : '🚧 PRÓXIMAMENTE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <VisuallyHidden>
        <div aria-live="assertive" id="aria-announcer"></div>
      </VisuallyHidden>
    </>
  );
}
