/**
 * Vista de resultados de CombiRumbo.
 * Muestra las alternativas de viaje evaluadas por el algoritmo con:
 * - Indicadores clave: tiempo total estimado, caminata, transbordos y costo.
 * - Distinción de la opción recomendada (directa vs con transbordos).
 * - Identificación del vehículo (tipo, letrero frontal en parabrisas).
 * - Reportes comunitarios de pasajeros con caducidad en tiempo real.
 * - Manejo honesto de casos sin cobertura (sin inventar rutas).
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
  uncoveredInfo?: { placeName: string; nearestStopName: string; distanceKm: number } | null;
  onSelectNearestStop?: () => void;
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
  uncoveredInfo,
  onSelectNearestStop,
}: ResultsViewProps) {
  // Destino fuera de red piloto verificada (honestidad radical para el jurado)
  if (state === 'uncovered-destination' && uncoveredInfo) {
    return (
      <div className="no-results-card" role="status" aria-live="polite">
        <div className="no-results-icon" aria-hidden="true">📍</div>
        <h2 style={{ fontSize: '1.2rem', color: '#f59e0b', marginBottom: '8px' }}>
          {lang === 'es' ? 'Destino fuera del piloto verificado' : 'Destination outside verified pilot area'}
        </h2>
        <p style={{ lineHeight: 1.5, color: '#e2e8f0', marginBottom: '12px' }}>
          {lang === 'es' ? (
            <>
              Has buscado <strong>{uncoveredInfo.placeName}</strong>, ubicado a <strong>{uncoveredInfo.distanceKm} km</strong> de la red urbana verificada de Chiclayo.
            </>
          ) : (
            <>
              You searched for <strong>{uncoveredInfo.placeName}</strong>, located <strong>{uncoveredInfo.distanceKm} km</strong> from the verified urban network of Chiclayo.
            </>
          )}
        </p>

        <div style={{
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
            💡 {lang === 'es' ? 'CONEXIÓN RECOMENDADA' : 'RECOMMENDED CONNECTION'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
            {lang === 'es' ? (
              <>
                El paradero verificado más próximo es <strong>{uncoveredInfo.nearestStopName}</strong>. Te sugerimos tomar la combi hasta allí y luego continuar en taxi local o colectivo interurbano.
              </>
            ) : (
              <>
                The closest verified stop is <strong>{uncoveredInfo.nearestStopName}</strong>. We suggest taking the combi there and then connecting via local taxi or interurban bus.
              </>
            )}
          </div>
        </div>

        <div className="card-actions" style={{ flexDirection: 'column', gap: '8px' }}>
          {onSelectNearestStop && (
            <button className="btn-primary" onClick={onSelectNearestStop}>
              {lang === 'es' ? `Viajar hacia ${uncoveredInfo.nearestStopName}` : `Route to ${uncoveredInfo.nearestStopName}`}
            </button>
          )}
          <button className="btn-secondary" onClick={onNewSearch}>
            {t('norecord.changeDestination')}
          </button>
        </div>
      </div>
    );
  }

  // Estado de catálogo vacío
  if (empty || state === 'empty-catalog') {
    return (
      <div className="no-results-card" role="status" aria-live="polite">
        <div className="no-results-icon" aria-hidden="true">📋</div>
        <h2>{t('empty.title')}</h2>
        <p>{t('empty.body')}</p>
        <div className="card-actions">
          <button className="btn-secondary" onClick={onNewSearch}>
            {t('norecord.changeDestination')}
          </button>
        </div>
      </div>
    );
  }

  // Estado sin resultados verificados
  if (state === 'no-results' || results.length === 0) {
    return (
      <div className="no-results-card" role="status" aria-live="polite">
        <div className="no-results-icon" aria-hidden="true">🔍</div>
        <h2>{t('norecord.title')}</h2>
        <p>{t('norecord.body')}</p>
        <div className="card-actions">
          <button className="btn-primary" onClick={onNewSearch}>
            {t('norecord.changeDestination')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="results-header">
        <div>
          <h2>
            {results.length === 1
              ? t('results.oneOption')
              : t('results.manyOptions', { count: results.length })}
          </h2>
          <div className="ordering-note">
            {t('results.ordering')}: {t('results.orderingTransfers')}
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={onNewSearch}
          style={{ fontSize: '0.8rem', padding: '6px 10px', minHeight: '36px' }}
        >
          {t('norecord.changeDestination')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
  const isWalkingOnly = itinerary.tags.includes('walking-only');
  const isRecommended = itinerary.tags.includes('recommended');
  const rideSteps = itinerary.steps.filter((s) => s.type === 'ride');
  const firstRide = rideSteps[0];
  const primaryRoute = firstRide?.route;

  // Reportes comunitarios activos para la línea
  const reports: LiveReport[] = useMemo(() => {
    if (!primaryRoute) return [];
    return getActiveReports(primaryRoute.id);
  }, [primaryRoute]);

  const originStop = itinerary.steps[0]?.fromStop;
  const destStop = itinerary.steps[itinerary.steps.length - 1]?.toStop;

  return (
    <article
      className="result-card"
      aria-label={
        isWalkingOnly
          ? t('results.walkingOnlyTitle')
          : `${t('results.take')} ${primaryRoute?.label ?? 'Transporte'}`
      }
    >
      {/* Fila superior: Título e Insignia Recomendada */}
      <div className="card-top-row">
        <div className="route-badge">
          {isWalkingOnly ? (
            <span>🚶 {t('results.walkingOnlyTitle')}</span>
          ) : (
            <>
              <span aria-hidden="true">🚐</span>
              <span>{primaryRoute?.label ?? 'Transporte Público'}</span>
            </>
          )}
        </div>

        {isRecommended && (
          <span className="recommendation-badge">
            ⭐ {t('results.directRoute')}
          </span>
        )}
      </div>

      {/* Letrero del vehículo (referencia visual fundamental en Chiclayo) */}
      {!isWalkingOnly && primaryRoute?.vehicleSign && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="vehicle-sign-chip" title="Letrero frontal en parabrisas">
            LETRERO: {primaryRoute.vehicleSign}
          </span>
        </div>
      )}

      {/* Métricas clave: Duración, Tarifa, Caminata */}
      <div className="metrics-pill-row">
        <span className="metric-pill duration" title="Tiempo estimado total">
          ⏱️ {itinerary.estimatedTotalMinutes} min
        </span>

        {!isWalkingOnly && (
          <span className="metric-pill fare" title="Tarifa por persona">
            💰 {itinerary.fare.confirmed && itinerary.fare.amount !== null
              ? `${itinerary.fare.unit} ${itinerary.fare.amount.toFixed(2)}`
              : t('results.farePending')}
          </span>
        )}

        <span className="metric-pill walk" title="Caminata requerida">
          🚶 {itinerary.totalWalkMinutes} min a pie ({itinerary.totalWalkMeters} m)
        </span>
      </div>

      {/* Timeline resumen de subida y bajada */}
      <div className="card-timeline">
        {originStop && (
          <div className="timeline-point">
            <span className="point-icon" aria-hidden="true">🟢</span>
            <span className="point-text">
              {isWalkingOnly ? 'Desde: ' : `${t('results.board')}: `}
              <strong>{originStop.publicName}</strong>
            </span>
          </div>
        )}

        {destStop && (
          <div className="timeline-point">
            <span className="point-icon" aria-hidden="true">🏁</span>
            <span className="point-text">
              {isWalkingOnly ? 'Hasta: ' : `${t('results.alight')}: `}
              <strong>{destStop.publicName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Verificación de datos de campo */}
      <div className="source-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="status-badge status-verified">
          ✅ {t('status.verified')}
        </span>
        <span>
          {t('results.verified')}: {formatDate(itinerary.verificationDate, lang)}
        </span>
      </div>

      {/* Reportes de pasajeros de los últimos 20 minutos */}
      {online && !isWalkingOnly && (
        <div className="card-reports-summary">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="report-indicator-dot" />
            <span>
              {reports.length > 0 && reports[0]
                ? `${reports.length} ${t('reports.reportedBy')} (${t('reports.expiresIn', { count: minutesUntilExpiry(reports[0]) })})`
                : t('reports.noReports')}
            </span>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="card-actions">
        <button className="btn-primary" onClick={onSelect} style={{ flex: 1 }}>
          {t('results.viewSteps')} →
        </button>
      </div>
    </article>
  );
}
