/**
 * App principal de CombiRumbo Chiclayo.
 * Diseño Transit Hub / Citymapper:
 * - Mapa interactivo permanente en pantalla completa / split view.
 * - Sidebar flotante de transporte con búsqueda conectada, resultados y pasos detallados.
 * - Selección interactiva de paraderos tocando directamente en el mapa.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from './accessibility/i18n';
import { useOnlineStatus } from './pwa/offline';
import { loadCatalog } from './catalog/catalog';
import { isCatalogEmpty } from './catalog/catalog';
import { saveCatalogToCache, getCachedSyncDate, loadCachedCatalog } from './pwa/cache';
import { EMPTY_CATALOG, type Catalog, type Stop } from './catalog/types';
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
  const [mobileMapExpanded, setMobileMapExpanded] = useState(false);

  // Cargar catálogo al iniciar
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

  // Sincronizar fecha de cache cuando hay catálogo
  const effectiveSyncDate = useMemo(() => {
    return online ? syncDate : getCachedSyncDate();
  }, [online, syncDate]);

  const handleSearch = useCallback(
    (fromId: string, toId: string) => {
      search.search(fromId, toId);
      setView('results');
      setMobileMapExpanded(false);
    },
    [search]
  );

  const handleSelectItinerary = useCallback((itineraryId: string) => {
    setSelectedItineraryId(itineraryId);
    setView('detail');
    setMobileMapExpanded(false);
  }, []);

  const handleBack = useCallback(() => {
    setView('results');
  }, []);

  const handleNewSearch = useCallback(() => {
    search.reset();
    setSelectedItineraryId(null);
    setView('search');
  }, [search]);

  // Selección directa desde los pines del mapa
  const handleSelectStopFromMap = useCallback((stop: Stop, role: 'origin' | 'destination') => {
    if (role === 'origin') {
      search.selectOrigin(stop);
    } else {
      search.selectDestination(stop);
    }
    // Si estamos en resultados o detalle y el usuario toca un pin en el mapa, regresar a búsqueda
    if (view !== 'search') {
      setView('search');
    }
  }, [search, view]);

  if (!catalog) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 700 }}>
          🚐 Cargando red verificada de Chiclayo...
        </p>
      </div>
    );
  }

  const empty = isCatalogEmpty(catalog);
  const selectedItinerary = search.results.find(i => i.id === selectedItineraryId);
  const activeItinerary = selectedItinerary || (search.results.length > 0 ? search.results[0] : null);

  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>

      <div className={`app-shell ${mobileMapExpanded ? 'map-expanded' : ''}`}>
        {/* VIEWPORT DEL MAPA PERMANENTE (Full-Screen o Split) */}
        <main className="map-viewport">
          <button
            type="button"
            className="mobile-view-toggle-btn"
            onClick={() => setMobileMapExpanded(!mobileMapExpanded)}
            aria-label={mobileMapExpanded ? 'Ver panel de rutas' : 'Ver mapa en pantalla completa'}
          >
            {mobileMapExpanded ? '📋 Ver Rutas' : '🗺️ Mapa Completo'}
          </button>

          <MapView
            catalog={catalog}
            itinerary={view === 'search' ? null : activeItinerary}
            onSelectStop={handleSelectStopFromMap}
            height="100%"
          />
        </main>

        {/* SIDEBAR FLOTANTE DE TRANSPORTE (Citymapper Style) */}
        <aside className="transit-sidebar" id="main-content">
          {/* Header Superior */}
          <header className="app-header">
            <div className="brand-row">
              <div className="brand-icon" aria-hidden="true">🚐</div>
              <div>
                <h1 className="brand-title">
                  CombiRumbo
                  <span className="brand-city-badge">Chiclayo</span>
                </h1>
                <div className="brand-subtitle">{t('app.tagline')}</div>
              </div>
            </div>

            <div className="header-controls">
              <div className="lang-segmented" role="group" aria-label="Idioma">
                <button
                  type="button"
                  className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
                  onClick={() => setLang('es')}
                  aria-pressed={lang === 'es'}
                >
                  {t('lang.es')}
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                >
                  {t('lang.en')}
                </button>
              </div>
            </div>
          </header>

          {/* Banner Offline */}
          {!online && (
            <div className="offline-banner" role="status" aria-live="polite">
              {t('offline.banner')}
            </div>
          )}

          {/* Contenido con Scroll de la Barra Lateral */}
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

          {/* Pie / Transparencia */}
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
      </div>

      <VisuallyHidden>
        <div aria-live="assertive" id="aria-announcer"></div>
      </VisuallyHidden>
    </>
  );
}
