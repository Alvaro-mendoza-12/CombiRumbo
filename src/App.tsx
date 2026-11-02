/**
 * App principal de CombiRumbo Chiclayo.
 * PWA móvil para buscar transporte público verificado en Chiclayo.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from './accessibility/i18n';
import { useOnlineStatus } from './pwa/offline';
import { loadCatalog } from './catalog/catalog';
import { isCatalogEmpty } from './catalog/catalog';
import { saveCatalogToCache, getCachedSyncDate, loadCachedCatalog } from './pwa/cache';
import { EMPTY_CATALOG, type Catalog } from './catalog/types';
import { useSearch } from './search/searchModel';
import { SearchView } from './search/SearchView';
import { ResultsView } from './search/ResultsView';
import { DetailView } from './search/DetailView';
import { VisuallyHidden } from './accessibility/VisuallyHidden';

type View = 'search' | 'results' | 'detail';

export default function App() {
  const { t, lang, setLang } = useI18n();
  const online = useOnlineStatus();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [syncDate, setSyncDate] = useState<string | null>(null);
  const [view, setView] = useState<View>('search');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  // Cargar catálogo al iniciar
  useEffect(() => {
    async function loadCatalogData() {
      try {
        // Intentar cargar desde el archivo JSON del repositorio
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
        // En offline o error: usar caché local
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
    },
    [search]
  );

  const handleSelectItinerary = useCallback((itineraryId: string) => {
    setSelectedItineraryId(itineraryId);
    setView('detail');
  }, []);

  const handleBack = useCallback(() => {
    setView('results');
  }, []);

  const handleNewSearch = useCallback(() => {
    search.reset();
    setView('search');
  }, [search]);

  if (!catalog) {
    return (
      <div className="loading">
        <p className="loading-dot">Cargando...</p>
      </div>
    );
  }

  const empty = isCatalogEmpty(catalog);
  const selectedItinerary = search.results.find(i => i.id === selectedItineraryId);

  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <header className="header">
        <div>
          <h1>{t('app.title')}</h1>
          <div className="tagline">{t('app.tagline')}</div>
        </div>
        <div className="lang-selector" role="group" aria-label="Idioma">
          <button
            className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
            onClick={() => setLang('es')}
            aria-pressed={lang === 'es'}
          >
            {t('lang.es')}
          </button>
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            {t('lang.en')}
          </button>
        </div>
      </header>

      {!online && (
        <div className="offline-banner" role="status" aria-live="polite">
          {t('offline.banner')}
        </div>
      )}

      {effectiveSyncDate && (
        <div className="sync-badge" aria-live="polite">
          {t('offline.syncDate', {
            date: new Date(effectiveSyncDate).toLocaleDateString(
              lang === 'es' ? 'es-PE' : 'en-US',
              { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
            ),
          })}
        </div>
      )}

      <main id="main-content">
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
          <div className="no-results">
            <p>No se encontró el itinerario.</p>
            <button className="btn-secondary" onClick={handleBack}>
              {t('detail.back')}
            </button>
          </div>
        )}
      </main>

      <details className="disclaimer">
        <summary>{t('disclaimer.title')}</summary>
        <p style={{ marginTop: '8px' }}>{t('disclaimer.body')}</p>
      </details>

      <VisuallyHidden>
        <div aria-live="assertive" id="aria-announcer"></div>
      </VisuallyHidden>
    </>
  );
}


