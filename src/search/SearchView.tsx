/**
 * Pantalla de búsqueda: origen, destino y botón "Buscar ruta".
 * Incluye geolocalización opcional (procesada localmente, no guardada).
 */

import { useState, useCallback } from 'react';
import type { useSearch } from './searchModel';
import { requestLocation, type GeoError } from './geolocation';
import type { Lang, TFunc } from '@/accessibility/i18n';

interface SearchViewProps {
  search: ReturnType<typeof useSearch>;
  catalog?: import('@/catalog/types').Catalog;
  empty: boolean;
  online: boolean;
  lang: Lang;
  t: TFunc;
  onSearch: (fromId: string, toId: string) => void;
}

export function SearchView({
  search,
  empty,
  t,
  onSearch,
}: SearchViewProps) {
  const [geoError, setGeoError] = useState<GeoError | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError(null);
    const result = await requestLocation(search.graph);
    setGeoLoading(false);

    if (!result.ok) {
      setGeoError(result.error);
      return;
    }

    // Si hay un paradero cercano, autocompletar el origen
    if (result.result.stop) {
      search.setOriginStopId(result.result.stop.id);
      search.setOriginQuery(result.result.stop.publicName);
    }
  }, [search]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!search.originStopId || !search.destinationStopId) return;
      onSearch(search.originStopId, search.destinationStopId);
    },
    [search.originStopId, search.destinationStopId, onSearch]
  );

  return (
    <div>
      {empty && (
        <div className="no-results" role="status" aria-live="polite">
          <h2>{t('empty.title')}</h2>
          <p>{t('empty.body')}</p>
          <p className="source-row">{t('empty.coverage')}</p>
        </div>
      )}

      <form className="search-card" onSubmit={handleSearchSubmit}>
        <div className="field">
          <label htmlFor="origin-input">{t('search.originLabel')}</label>
          <input
            id="origin-input"
            type="text"
            list="stops-list"
            placeholder={t('search.originPlaceholder')}
            value={search.originQuery}
            onChange={(e) => {
              search.setOriginQuery(e.target.value);
              const match = search.stopNames.find(
                s => s.name.toLowerCase() === e.target.value.toLowerCase()
              );
              search.setOriginStopId(match ? match.id : null);
            }}
            autoComplete="off"
            aria-describedby="origin-help"
          />
        </div>

        <div className="field">
          <label htmlFor="destination-input">{t('search.destinationLabel')}</label>
          <input
            id="destination-input"
            type="text"
            list="stops-list"
            placeholder={t('search.destinationPlaceholder')}
            value={search.destinationQuery}
            onChange={(e) => {
              search.setDestinationQuery(e.target.value);
              const match = search.stopNames.find(
                s => s.name.toLowerCase() === e.target.value.toLowerCase()
              );
              search.setDestinationStopId(match ? match.id : null);
            }}
            autoComplete="off"
          />
          <datalist id="stops-list">
            {search.stopNames.map(s => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!search.originStopId || !search.destinationStopId || empty}
          aria-disabled={!search.originStopId || !search.destinationStopId || empty}
        >
          {t('search.button')}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleLocation}
          disabled={geoLoading || empty}
          aria-label={t('search.useLocation')}
        >
          {geoLoading ? '...' : '📍 ' + t('search.useLocation')}
        </button>

        {geoError && (
          <p className="location-hint" role="alert" aria-live="assertive">
            {geoError === 'empty-catalog'
              ? t('search.locationEmpty')
              : t('search.locationDenied')}
          </p>
        )}

        <p className="privacy-note" id="origin-help">
          {t('search.locationHint')}
        </p>
        <p className="privacy-note">{t('app.privacyNote')}</p>
      </form>
    </div>
  );
}
