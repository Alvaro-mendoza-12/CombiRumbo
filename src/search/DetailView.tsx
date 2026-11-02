/**
 * Vista de detalle de un itinerario.
 * Muestra pasos del viaje con fuente, fecha, estado e incertidumbres.
 */

import { useState, lazy, Suspense } from 'react';
import type { Catalog } from '@/catalog/types';
import type { Itinerary, ItineraryStep } from '@/routing/format';
import { formatDate } from '@/routing/format';
import { getStatusVisual } from '@/accessibility/a11y';
import { getSource } from '@/catalog/catalog';
import type { Lang, TFunc } from '@/accessibility/i18n';
import { ReportForm } from '@/reports/ReportsView';

const MapView = lazy(() => import('@/map/MapView').then(m => ({ default: m.MapView })));

interface DetailViewProps {
  itinerary: Itinerary;
  catalog: Catalog;
  online: boolean;
  lang: Lang;
  t: TFunc;
  onBack: () => void;
}

export function DetailView({
  itinerary,
  catalog,
  online,
  lang,
  t,
  onBack,
}: DetailViewProps) {
  const [showMap, setShowMap] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
        ← {t('detail.back')}
      </button>

      <div className="ordering-note" style={{ marginBottom: '8px' }}>
        {t('results.ordering')}: {itinerary.orderingCriteria}
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{t('detail.steps')}</h2>

      {itinerary.steps.map((step, idx) => (
        <StepDetail
          key={idx}
          step={step}
          catalog={catalog}
          lang={lang}
          t={t}
        />
      ))}

      {/* Tarifa total */}
      <div className="fare-row" style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
        <span aria-hidden="true">💰</span>
        <span aria-label={t('results.fare')}>
          {itinerary.fare.confirmed && itinerary.fare.amount !== null
            ? <span className="fare-confirmed">
                {t('detail.fareConfirmed')}: {itinerary.fare.unit} {itinerary.fare.amount}
              </span>
            : <span className="fare-pending">{t('detail.farePending')}</span>}
        </span>
      </div>

      <div className="result-actions">
        <button className="btn-secondary" onClick={() => setShowMap(!showMap)} aria-expanded={showMap}>
          {showMap ? '▼ ' : '▶ '}{t('results.viewMap')}
        </button>
        {online && (
          <button className="btn-secondary" onClick={() => setShowReportForm(!showReportForm)} aria-expanded={showReportForm}>
            {t('results.reportChange')}
          </button>
        )}
      </div>

      {showMap && (
        <Suspense fallback={<div className="loading"><p className="loading-dot">Cargando mapa...</p></div>}>
          <MapView itinerary={itinerary} catalog={catalog} />
        </Suspense>
      )}

      {showReportForm && online && (
        <ReportForm itinerary={itinerary} catalog={catalog} t={t} />
      )}
    </div>
  );
}

function StepDetail({
  step,
  catalog,
  lang,
  t,
}: {
  step: ItineraryStep;
  catalog: Catalog;
  lang: Lang;
  t: TFunc;
}) {
  if (step.type === 'walk') {
    return (
      <div className="step-row">
        <span className="step-icon" aria-hidden="true">🚶</span>
        <span className="step-label">
          {t('results.walk')}
          {step.fromStop && `: ${step.fromStop.publicName}`}
          {step.toStop && ` → ${step.toStop.publicName}`}
          {step.walkMeters && ` (${step.walkMeters} m)`}
        </span>
      </div>
    );
  }

  const visual = getStatusVisual(step.status);
  const source = step.source ?? (step.segment ? getSource(catalog, step.segment.sourceId) : undefined);

  return (
    <div className="result-card" style={{ marginBottom: '8px' }}>
      <div className="step-row">
        <span className="step-icon" aria-hidden="true">🚌</span>
        <span className="step-label">
          <strong>{step.route?.label}</strong>
          {step.fromStop && <><br />{t('results.board')}: {step.fromStop.publicName}</>}
          {step.toStop && <><br />{t('results.alight')}: {step.toStop.publicName}</>}
        </span>
      </div>

      {step.boardingNote && (
        <div className="source-row">{step.boardingNote}</div>
      )}
      {step.alightingNote && (
        <div className="source-row">{step.alightingNote}</div>
      )}

      <div className="step-row">
        <span className={`status-badge ${visual.className}`} role="img" aria-label={t(visual.labelKey)}>
          {visual.icon} {t(visual.labelKey)}
        </span>
      </div>

      {step.fare && step.fare.amount !== undefined ? (
        <div className="fare-row">
          <span className="fare-confirmed">
            {t('results.fare')}: {step.fare.unit} {step.fare.amount}
          </span>
        </div>
      ) : (
        <div className="fare-row">
          <span className="fare-pending">{t('detail.farePending')}</span>
        </div>
      )}

      {step.observedAt && (
        <div className="source-row">
          {t('detail.observedAt')}: {formatDate(step.observedAt, lang)}
        </div>
      )}

      {source && (
        <div className="source-row">
          {t('detail.source')}: {source.title}
          {source.type === 'field-observation' && ' (observación de campo)'}
        </div>
      )}

      {step.segment && (
        <div className="source-row">
          {t('detail.method')}: {step.segment.evidenceMethod}
        </div>
      )}

      {step.route && (
        <div className="source-row">
          {t('detail.reviewAfter')}: {formatDate(step.route.reviewAfter, lang)}
        </div>
      )}
    </div>
  );
}
