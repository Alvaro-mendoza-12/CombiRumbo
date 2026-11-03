/**
 * Vista detallada paso a paso del itinerario de viaje.
 * Proporciona indicaciones de campo claras y accionables:
 * - Dónde caminar y referencias del paradero.
 * - Cómo identificar el vehículo (letrero de parabrisas, color y tipo).
 * - Dónde y con qué frase pedir la bajada al cobrador/conductor.
 * - Mapa interactivo integrado con trazado del recorrido.
 * - Tarifa confirmada y ficha de procedencia de datos de campo.
 * - Reporte de incidencias en tiempo real por pasajeros.
 */

import { useState } from 'react';
import type { Catalog } from '@/catalog/types';
import type { Itinerary, ItineraryStep } from '@/routing/format';
import { formatDate } from '@/routing/format';
import { getStatusVisual } from '@/accessibility/a11y';
import { getSource } from '@/catalog/catalog';
import type { Lang, TFunc } from '@/accessibility/i18n';
import { ReportForm } from '@/reports/ReportsView';
import { MapView } from '@/map/MapView';

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
  const [showReportForm, setShowReportForm] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const isWalkingOnly = itinerary.tags.includes('walking-only');
  const rideSteps = itinerary.steps.filter((s) => s.type === 'ride');
  const primaryRoute = rideSteps[0]?.route;

  return (
    <div className="detail-container">
      {/* Botón de retroceso */}
      <button
        type="button"
        className="btn-secondary"
        onClick={onBack}
        style={{ alignSelf: 'flex-start' }}
      >
        ← {t('detail.back')}
      </button>

      {/* Tarjeta Hero Resumen */}
      <div className="detail-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {isWalkingOnly ? t('results.walkingOnlyTitle') : primaryRoute?.label ?? t('detail.title')}
          </h2>
          {primaryRoute?.vehicleType && (
            <span className="vehicle-sign-chip" style={{ textTransform: 'uppercase' }}>
              {primaryRoute.vehicleType}
            </span>
          )}
        </div>

        {/* Métricas clave */}
        <div className="metrics-pill-row">
          <span className="metric-pill duration">
            ⏱️ {itinerary.estimatedTotalMinutes} min total
          </span>
          {!isWalkingOnly && (
            <span className="metric-pill fare">
              💰 {itinerary.fare.confirmed && itinerary.fare.amount !== null
                ? `${itinerary.fare.unit} ${itinerary.fare.amount.toFixed(2)}`
                : t('results.farePending')}
            </span>
          )}
          <span className="metric-pill walk">
            🚶 {itinerary.totalWalkMinutes} min a pie ({itinerary.totalWalkMeters} m)
          </span>
        </div>

        <div className="ordering-note" style={{ marginTop: '8px' }}>
          {t('results.ordering')}: {itinerary.orderingCriteria}
        </div>
      </div>

      {/* Botón para alternar mapa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowMap(!showMap)}
          aria-expanded={showMap}
          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
        >
          {showMap ? `▼ ${t('results.hideMap')}` : `▶ ${t('results.viewMap')}`}
        </button>

        {online && !isWalkingOnly && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowReportForm(!showReportForm)}
            aria-expanded={showReportForm}
            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          >
            📢 {t('results.reportChange')}
          </button>
        )}
      </div>

      {/* Mapa Leaflet Interactivo */}
      {showMap && (
        <MapView itinerary={itinerary} catalog={catalog} height="300px" />
      )}

      {/* Formulario de Reporte Comunitario */}
      {showReportForm && online && (
        <div className="report-modal-box">
          <ReportForm itinerary={itinerary} catalog={catalog} t={t} />
        </div>
      )}

      {/* Timeline con Instrucciones Paso a Paso */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '8px' }}>
        {t('detail.steps')}
      </h3>

      <div className="detail-timeline">
        {itinerary.steps.map((step, idx) => (
          <StepCard
            key={idx}
            step={step}
            stepIndex={idx + 1}
            catalog={catalog}
            lang={lang}
            t={t}
          />
        ))}
      </div>

      {/* Ficha de Procedencia y Verificación */}
      <div className="provenance-card">
        <h4>📋 Ficha de verificación de campo (Chiclayo)</h4>
        <div>
          <strong>Observación presencial:</strong> {formatDate(itinerary.verificationDate, lang)}
        </div>
        <div>
          <strong>Vigencia estimada:</strong> {primaryRoute?.reviewAfter ? formatDate(primaryRoute.reviewAfter, lang) : '30 días'}
        </div>
        <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
          Protocolo CombiRumbo: Datos recogidos in-situ por observadores locales en Chiclayo. No dependemos de GPS satelital no verificado ni de datos inventados.
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  stepIndex,
  catalog,
  lang,
  t,
}: {
  step: ItineraryStep;
  stepIndex: number;
  catalog: Catalog;
  lang: Lang;
  t: TFunc;
}) {
  // Paso de Caminata
  if (step.type === 'walk' || step.type === 'direct-walk') {
    return (
      <div className={`detail-step-card ${step.type}`}>
        <div className="step-header-row">
          <span className="step-type-badge" style={{ color: '#38bdf8' }}>
            🚶 {stepIndex}. {t('results.walk')} ({step.walkMeters ?? 0} m · ~{step.durationMinutes ?? 1} min)
          </span>
        </div>

        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {step.fromStop && <span>Desde: {step.fromStop.publicName}</span>}
          {step.toStop && <span> → Hasta: {step.toStop.publicName}</span>}
        </div>

        {step.toStop?.landmarkContext && (
          <div className="tip-box">
            📍 <strong>Referencia:</strong> {step.toStop.landmarkContext}
          </div>
        )}
      </div>
    );
  }

  // Paso de Viaje en Transporte
  const visual = getStatusVisual(step.status);
  const source = step.source ?? (step.segment ? getSource(catalog, step.segment.sourceId) : undefined);
  const boardingCue = step.boardingTip || step.boardingNote || step.segment?.boardingCue;
  const alightingCue = step.alightingTip || step.alightingNote || step.segment?.alightingCue;

  return (
    <div className="detail-step-card ride">
      {/* Encabezado del paso */}
      <div className="step-header-row">
        <span className="step-type-badge" style={{ color: '#f59e0b' }}>
          🚐 {stepIndex}. {t('results.board')}: {step.route?.label}
        </span>
        {step.durationMinutes && (
          <span style={{ fontSize: '0.8rem', color: '#fde047', fontWeight: 600 }}>
            ~{step.durationMinutes} min a bordo
          </span>
        )}
      </div>

      {/* Paraderos de subida y bajada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.95rem' }}>
          <strong>Punto de subida:</strong> {step.fromStop?.publicName}
          {step.fromStop?.landmarkContext && (
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>
              📍 {step.fromStop.landmarkContext}
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.95rem', marginTop: '4px' }}>
          <strong>Punto de bajada:</strong> {step.toStop?.publicName}
          {step.toStop?.landmarkContext && (
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>
              📍 {step.toStop.landmarkContext}
            </span>
          )}
        </div>
      </div>

      {/* Guía visual para identificar el vehículo */}
      {step.route && (
        <div className="vehicle-guide-box">
          <div style={{ fontWeight: 700, color: '#38bdf8' }}>
            {t('detail.vehicleHeader')}
          </div>
          <div>
            <strong>{t('detail.vehicleSign')}:</strong> "{step.route.vehicleSign}"
          </div>
          <div>
            <strong>{t('detail.vehicleColor')}:</strong> {step.route.vehicleColor} ({step.route.vehicleType})
          </div>
        </div>
      )}

      {/* Indicación de abordaje */}
      {boardingCue && (
        <div className="tip-box">
          👋 <strong>{t('detail.boardingCue')}:</strong> {boardingCue}
        </div>
      )}

      {/* Indicación de descenso (frase al cobrador) */}
      {alightingCue && (
        <div className="tip-box" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#fca5a5' }}>
          🛑 <strong>{t('detail.alightingCue')}:</strong> "{alightingCue}"
        </div>
      )}

      {/* Fila de Tarifa */}
      <div className="fare-row" style={{ marginTop: '4px' }}>
        <span aria-hidden="true">💰</span>
        <span>
          {step.fare && step.fare.amount !== null ? (
            <strong className="fare-confirmed">
              {t('results.fare')}: {step.fare.unit} {step.fare.amount.toFixed(2)}
            </strong>
          ) : (
            <span className="fare-pending">{t('results.farePending')}</span>
          )}
        </span>
      </div>

      {/* Estado y trazabilidad */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
        <span className={`status-badge ${visual.className}`}>
          {visual.icon} {t(visual.labelKey)}
        </span>
        {step.observedAt && (
          <span>{formatDate(step.observedAt, lang)}</span>
        )}
        {source && (
          <span>Obs: {source.observerId || source.title}</span>
        )}
      </div>
    </div>
  );
}
