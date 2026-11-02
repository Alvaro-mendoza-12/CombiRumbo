/**
 * Vista de resultados: lista de itinerarios en tarjetas.
 * Cada tarjeta muestra línea, subida, bajada, tarifa y fecha de verificación.
 * Los reportes de pasajeros van en una fila separada.
 */

import { useMemo } from 'react';
import type { Catalog, LiveReport } from '@/catalog/types';
import type { Itinerary } from '@/routing/format';
import { formatDate } from '@/routing/format';
import type { SearchState } from './searchModel';
import { getActiveReports } from '@/reports/store';
import { minutesUntilExpiry } from '@/reports/expiry';
import type { Lang, TFunc } from '@/accessibility/i18n';

interface ResultsViewProps {
  results: Itinerary[];
  state: SearchState;
  empty: boolean;
  online: boolean;
  lang: Lang;
  t: TFunc;
  onSelectItinerary: (id: string) => void;
  onNewSearch: () => void;
  catalog: Catalog;
}

export function ResultsView({
  results,
  state,
  empty,
  online,
  lang,
  t,
  onSelectItinerary,
  onNewSearch,
}: ResultsViewProps) {
  if (empty || state === 'empty-catalog') {
    return (
      <div className="no-results" role="status" aria-live="polite">
        <h2>{t('empty.title')}</h2>
        <p>{t('empty.body')}</p>
        <div className="no-results-actions">
          <button className="btn-secondary" onClick={onNewSearch}>
            {t('norecord.changeDestination')}
          </button>
        </div>
      </div>
    );
  }

  if (state === 'no-results') {
    return (
      <div className="no-results" role="status" aria-live="polite">
        <h2>{t('norecord.title')}</h2>
        <p>{t('norecord.body')}</p>
        <div className="no-results-actions">
          <button className="btn-secondary" onClick={onNewSearch}>
            {t('norecord.changeDestination')}
          </button>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="results-header">
        <h2>
          {results.length === 1
            ? t('results.oneOption')
            : t('results.manyOptions', { count: results.length })}
        </h2>
        <div className="ordering-note">
          {t('results.ordering')}: {t('results.orderingTransfers')}
        </div>
      </div>

      {results.map((itinerary) => (
        <ResultCard
          key={itinerary.id}
          itinerary={itinerary}
          lang={lang}
          t={t}
          onSelect={() => onSelectItinerary(itinerary.id)}
          online={online}
        />
      ))}
    </div>
  );
}

function ResultCard({
  itinerary,
  lang,
  t,
  onSelect,
  online,
}: {
  itinerary: Itinerary;
  lang: Lang;
  t: TFunc;
  onSelect: () => void;
  online: boolean;
}) {
  const firstRide = itinerary.steps.find(s => s.type === 'ride');
  const route = firstRide?.route;
  const routeLabel = route?.label ?? '---';

  const reports: LiveReport[] = useMemo(() => {
    if (!route) return [];
    return getActiveReports(route.id);
  }, [route]);

  return (
    <article className="result-card" aria-label={`${t('results.take')} ${routeLabel}`}>
      <h3>{t('results.take')} {routeLabel}</h3>

      {itinerary.steps.map((step, idx) => {
        if (step.type === 'walk') {
          return (
            <div key={idx} className="step-row">
              <span className="step-icon" aria-hidden="true">🚶</span>
              <span className="step-label">
                {t('results.walk')}
                {step.fromStop && `: ${step.fromStop.publicName}`}
                {step.toStop && ` → ${step.toStop.publicName}`}
              </span>
            </div>
          );
        }

        return (
          <div key={idx} className="step-row">
            <span className="step-icon" aria-hidden="true">🚌</span>
            <span className="step-label">
              {idx === 0 || itinerary.steps.slice(0, idx).every(s => s.type === 'walk')
                ? <><strong>{t('results.board')}</strong>{step.fromStop ? `: ${step.fromStop.publicName}` : ''}<br /></>
                : null}
              {step.route && <strong>{step.route.label}</strong>}
              {step.toStop && ` → ${t('results.alight')}: ${step.toStop.publicName}`}
            </span>
          </div>
        );
      })}

      {/* Tarifa */}
      <div className="fare-row">
        <span aria-hidden="true">💰</span>
        <span aria-label={t('results.fare')}>
          {itinerary.fare.confirmed && itinerary.fare.amount !== null
            ? <span className="fare-confirmed">
                {t('results.fare')}: {itinerary.fare.unit} {itinerary.fare.amount}
              </span>
            : <span className="fare-pending">{t('results.farePending')}</span>}
        </span>
      </div>

      {/* Estado de verificación */}
      <div className="step-row">
        <span className="status-badge status-verified" role="img" aria-label={t('status.verified')}>
          ✅ {t('status.verified')}
        </span>
        <span className="source-row">
          {t('results.verified')}: {formatDate(itinerary.verificationDate, lang)}
        </span>
      </div>

      {/* Reportes de pasajero (fila separada) */}
      {online && route && reports.length > 0 && (
        <div className="report-section" aria-live="polite">
          <h4>{t('reports.reportedBy')}</h4>
          {reports.map(r => (
            <div key={r.id} className="report-row">
              <span className="report-badge">
                {r.countBucket} {t('reports.reportedBy')}
              </span>
              <span>{t('reports.minutesAgo', { count: Math.max(1, Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 60000)) })}</span>
              <span>· {t('reports.expiresIn', { count: minutesUntilExpiry(r) })}</span>
            </div>
          ))}
        </div>
      )}

      {online && route && reports.length === 0 && (
        <div className="report-section">
          <h4>{t('reports.noReports')}</h4>
        </div>
      )}

      <div className="result-actions">
        <button className="btn-secondary" onClick={onSelect}>
          {t('results.viewSteps')}
        </button>
      </div>
    </article>
  );
}
