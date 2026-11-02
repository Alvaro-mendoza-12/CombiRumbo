/**
 * Formulario de reporte de pasajero.
 * El pasajero reporta manualmente una observación asociada a una ruta/paradero.
 * El reporte se fecha, caduca y nunca modifica el catálogo verificado.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Catalog, ReportKind } from '@/catalog/types';
import type { Itinerary } from '@/routing/format';
import { addReport } from './store';
import { getActiveReports } from './store';
import { minutesUntilExpiry } from './expiry';
import type { TFunc } from '@/accessibility/i18n';
import type { TranslationKey } from '@/i18n/es';

interface ReportFormProps {
  itinerary: Itinerary;
  catalog: Catalog;
  t: TFunc;
}

const REPORT_KINDS: ReportKind[] = ['unit-passed', 'unit-absent', 'stop-changed', 'other'];

const KIND_LABELS: Record<ReportKind, TranslationKey> = {
  'unit-passed': 'reports.unitPassed',
  'unit-absent': 'reports.unitAbsent',
  'stop-changed': 'reports.stopChanged',
  'other': 'reports.other',
};

export function ReportForm({ itinerary, catalog, t }: ReportFormProps) {
  const routes = useMemo(() => {
    const routeIds = new Set(
      itinerary.steps.filter(s => s.route).map(s => s.route!.id)
    );
    return catalog.routes.filter(r => routeIds.has(r.id));
  }, [itinerary, catalog]);

  const [selectedRouteId, setSelectedRouteId] = useState(
    routes.length > 0 ? routes[0]!.id : ''
  );
  const [selectedStopId, setSelectedStopId] = useState('');
  const [selectedKind, setSelectedKind] = useState<ReportKind>('unit-passed');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stops = useMemo(() => {
    const stopIds = new Set<string>();
    for (const step of itinerary.steps) {
      if (step.fromStop) stopIds.add(step.fromStop.id);
      if (step.toStop) stopIds.add(step.toStop.id);
    }
    return catalog.stops.filter(s => stopIds.has(s.id));
  }, [itinerary, catalog]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedRouteId) return;

      const result = addReport(selectedRouteId, selectedStopId || undefined, selectedKind);
      if (!result.ok) {
        setError(t('reports.limitReached'));
        return;
      }

      setSent(true);
      setError(null);
    },
    [selectedRouteId, selectedStopId, selectedKind, t]
  );

  // Reportes activos para mostrar
  const activeReports = useMemo(
    () => selectedRouteId ? getActiveReports(selectedRouteId) : [],
    [selectedRouteId, sent]
  );

  if (sent) {
    return (
      <div className="report-section" role="status" aria-live="polite">
        <h4>{t('reports.sent')}</h4>
        {activeReports.map(r => (
          <div key={r.id} className="report-row">
            <span className="report-badge">
              {r.countBucket} {t('reports.reportedBy')}
            </span>
            <span>{t('reports.expiresIn', { count: minutesUntilExpiry(r) })}</span>
          </div>
        ))}
        <button
          className="btn-secondary"
          style={{ marginTop: '8px' }}
          onClick={() => setSent(false)}
        >
          {t('reports.title')}
        </button>
      </div>
    );
  }

  return (
    <form className="report-section report-form" onSubmit={handleSubmit} aria-label={t('reports.title')}>
      <h4>{t('reports.title')}</h4>

      <div className="field">
        <label htmlFor="report-route">{t('reports.selectRoute')}</label>
        <select
          id="report-route"
          value={selectedRouteId}
          onChange={(e) => setSelectedRouteId(e.target.value)}
          required
        >
          {routes.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="report-stop">{t('reports.selectStop')}</label>
        <select
          id="report-stop"
          value={selectedStopId}
          onChange={(e) => setSelectedStopId(e.target.value)}
        >
          <option value="">---</option>
          {stops.map(s => (
            <option key={s.id} value={s.id}>{s.publicName}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="report-kind">{t('reports.selectKind')}</label>
        <select
          id="report-kind"
          value={selectedKind}
          onChange={(e) => setSelectedKind(e.target.value as ReportKind)}
          required
        >
          {REPORT_KINDS.map(kind => (
            <option key={kind} value={kind}>
              {t(KIND_LABELS[kind])}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="location-hint" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={!selectedRouteId}>
        {t('reports.send')}
      </button>
    </form>
  );
}
