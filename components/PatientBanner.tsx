'use client';

import { useState } from 'react';
import { CERTAINTY_LABELS, PatientRecord } from '@/lib/patients';

/**
 * The patient banner, fixed above every screen once a record is open.
 *
 * Four lines and an alert strip, readable in about ten seconds. Density is the
 * whole point: it has to fit in roughly 120–160px so the form beneath it stays
 * usable on a 768px-tall consulting-room laptop.
 *
 * Stage and treatment values arrive with the instrument and medication slices.
 * Until then those lines say what is missing rather than showing a zero — a
 * blank stage and a stage of nought are very different clinical statements.
 */
const ALERT_STYLES: Record<string, string> = {
  high: 'border-brand-red/40 bg-brand-red/10 text-brand-red',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  low: 'border-line bg-field text-muted',
};

function primaryIdentifier(patient: PatientRecord): string | null {
  const folder = patient.identifiers.find((identifier) => identifier.system === 'folder');
  return folder?.value ?? patient.identifiers[0]?.value ?? null;
}

export default function PatientBanner({ patient }: { patient: PatientRecord }) {
  const [collapsed, setCollapsed] = useState(false);

  const deceased = patient.status === 'deceased';
  const folder = primaryIdentifier(patient);
  const stageModule = patient.modules.find((module) => module.is_primary);

  // "Not seen for a long time" is a state of its own: when every value is
  // stale, the dates matter more than the values. The elapsed months come from
  // the API — measuring them during render reads a clock that never stops.
  const monthsSinceSeen = patient.months_since_seen;
  const lapsed = monthsSinceSeen !== null && monthsSinceSeen >= 12;

  return (
    <section
      aria-label="Patient summary"
      className={`rounded-xl border bg-surface ${
        deceased ? 'border-neutral-400' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1 space-y-1">
          {/* 1 — identity */}
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-mono text-xs text-muted">{patient.registry_no}</span>
            <span className="text-base font-semibold tracking-tight">{patient.name}</span>
            <span className="text-muted">
              {patient.age !== null ? `${patient.age}` : 'age unknown'}
              {patient.age_is_estimated && patient.age !== null ? ' (est.)' : ''}
              {' · '}
              {patient.sex}
              {folder && ` · Folder ${folder}`}
            </span>
            {deceased && (
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                Deceased — record is read-only
              </span>
            )}
          </p>

          {!collapsed && (
            <>
              {/* 2 — diagnosis */}
              <p className="text-sm">
                {patient.diagnosis ? (
                  <>
                    <span className="font-medium">{patient.diagnosis.label}</span>
                    <span className="text-muted">
                      {' · '}
                      {CERTAINTY_LABELS[patient.diagnosis.certainty]}
                      {' · set '}
                      {patient.diagnosis.diagnosed_on}
                      {patient.diagnosis.disease_duration_years !== null &&
                        ` · duration ${patient.diagnosis.disease_duration_years.toFixed(1)} years`}
                      {patient.diagnosis.revision_count > 0 &&
                        ` · revised ${patient.diagnosis.revision_count}×`}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">
                    No diagnosis recorded — baseline assessment incomplete
                  </span>
                )}
              </p>

              {/* 3 — stage */}
              <p className="text-sm text-muted">
                {stageModule?.stage_instrument
                  ? `${stageModule.stage_instrument}: awaiting first assessment (${stageModule.label})`
                  : stageModule
                    ? `${stageModule.label}: no staging measure for this module`
                    : 'No module open'}
              </p>

              {/* 4 — treatment */}
              <p className="text-sm text-muted">
                Treatment not yet recorded
                {patient.date_last_seen &&
                  ` · last seen ${patient.date_last_seen}${
                    lapsed ? ` (${monthsSinceSeen} months ago)` : ''
                  }`}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((was) => !was)}
          className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted
                     transition hover:border-brand-green hover:text-brand-green"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {/* The alert strip: auto-populated, never typed, and collapsed entirely
          when there is nothing to say. */}
      {patient.alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-2">
          {patient.alerts.map((alert) => (
            <span
              key={`${alert.kind}-${alert.text}`}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                ALERT_STYLES[alert.severity] ?? ALERT_STYLES.low
              }`}
            >
              {alert.text}
            </span>
          ))}
        </div>
      )}

      {lapsed && patient.alerts.length === 0 && (
        <div className="border-t border-line px-4 py-2 text-xs text-amber-700">
          Not seen for {monthsSinceSeen} months — every value above is stale.
        </div>
      )}
    </section>
  );
}
