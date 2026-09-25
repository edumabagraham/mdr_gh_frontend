'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import Axios from 'axios';
import {
  DiagnosisHistoryEntry,
  getDiagnosisHistory,
  getPatientRecord,
  PatientRecord,
  setPrimaryModule,
} from '@/lib/patients';
import AppShell from '@/components/AppShell';
import PatientBanner from '@/components/PatientBanner';
import SymptomOnsetCard from '@/components/SymptomOnsetCard';

export default function PatientRecordPage() {
  const params = useParams<{ registryNo: string }>();
  const registryNo = params.registryNo;
  const router = useRouter();

  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: patient, error, isLoading, mutate } = useSWR<PatientRecord>(
    ['patient', registryNo],
    () => getPatientRecord(registryNo),
    { revalidateOnFocus: false },
  );

  const { data: history } = useSWR<{ diagnoses: DiagnosisHistoryEntry[]; revision_count: number }>(
    historyOpen ? ['diagnoses', registryNo] : null,
    () => getDiagnosisHistory(registryNo),
  );

  if (Axios.isAxiosError(error) && error.response?.status === 401) {
    router.replace('/login');
  }

  const handlePrimary = async (module: string) => {
    await setPrimaryModule(registryNo, module);
    mutate();
  };

  return (
    <AppShell>
      {isLoading && <p className="text-sm text-muted">Loading the record…</p>}

      {error && !isLoading && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm text-brand-red">
            {Axios.isAxiosError(error) && error.response?.status === 404
              ? `No patient is registered as ${registryNo}.`
              : 'The record could not be loaded.'}
          </p>
        </div>
      )}

      {patient && (
        <div className="space-y-4">
          <PatientBanner patient={patient} />

          {/* Step 3 of the encounter sequence, and it comes before the
              diagnosis for a reason: the duration shown on the card below is
              derived from this date. */}
          <SymptomOnsetCard patient={patient} onSaved={() => mutate()} />

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Diagnosis, with the history behind a disclosure. */}
            <section className="rounded-xl border border-line bg-surface lg:col-span-2">
              <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold">Diagnosis</h2>
                <Link
                  href={`/patients/${registryNo}/diagnose`}
                  className="rounded-md bg-brand-red px-3 py-1.5 text-xs font-semibold text-white
                             transition hover:bg-brand-red-dark"
                >
                  {patient.diagnosis ? 'Revise diagnosis' : 'Record diagnosis'}
                </Link>
              </header>

              <div className="px-4 py-3">
                {patient.diagnosis ? (
                  <>
                    <p className="text-sm font-medium">{patient.diagnosis.label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {patient.diagnosis.certainty} · set {patient.diagnosis.diagnosed_on}
                      {patient.diagnosis.diagnosed_by && ` by ${patient.diagnosis.diagnosed_by}`}
                      {patient.diagnosis.criteria_set && ` · ${patient.diagnosis.criteria_set}`}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {patient.diagnosis.disease_duration_years !== null
                        ? `Disease duration ${patient.diagnosis.disease_duration_years.toFixed(1)} years, from symptom onset ${patient.symptom_onset_on}`
                        : 'Disease duration unknown — no symptom onset recorded'}
                    </p>

                    {/* A patient revised twice is clinically different from one
                        never revised, so the count is on the face of the card. */}
                    <p className="mt-2 text-xs">
                      <button
                        onClick={() => setHistoryOpen((was) => !was)}
                        className="font-medium text-brand-green hover:underline"
                      >
                        {historyOpen ? 'Hide history' : 'Show history'}
                      </button>
                      <span className="text-muted">
                        {' · '}
                        {patient.diagnosis.revision_count === 0
                          ? 'never revised'
                          : `revised ${patient.diagnosis.revision_count}×`}
                      </span>
                    </p>

                    {historyOpen && history && (
                      <ol className="mt-3 space-y-2 border-t border-line pt-3">
                        {history.diagnoses.map((entry) => (
                          <li key={entry.id} className="text-xs">
                            <p>
                              <span className="font-medium">{entry.label}</span>
                              <span className="text-muted">
                                {' · '}
                                {entry.diagnosed_on}
                                {entry.diagnosed_by && ` · ${entry.diagnosed_by}`}
                                {entry.is_current ? ' · current' : ' · superseded'}
                              </span>
                            </p>
                            {entry.rationale && (
                              <p className="mt-0.5 text-muted">{entry.rationale}</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    No diagnosis has been recorded. Until one is, no module is open and no
                    assessment schedule applies.
                  </p>
                )}
              </div>
            </section>

            {/* What is open, and why it opened. */}
            <section className="rounded-xl border border-line bg-surface">
              <header className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold">Modules and panels</h2>
              </header>

              <div className="divide-y divide-line">
                {patient.modules.length === 0 && (
                  <p className="px-4 py-3 text-xs text-muted">No module open.</p>
                )}

                {patient.modules.map((module) => (
                  <div key={module.module} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{module.label}</p>
                      <p className="text-xs text-muted">
                        {module.stage_instrument ?? 'no staging measure'} · opened{' '}
                        {new Date(module.opened_at).toLocaleDateString()}
                      </p>
                    </div>

                    {module.is_primary ? (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-medium text-brand-green">
                        stages banner
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePrimary(module.module)}
                        className="rounded-md border border-line px-2 py-1 text-[11px] font-medium
                                   transition hover:border-brand-green hover:text-brand-green"
                      >
                        Stage from this
                      </button>
                    )}
                  </div>
                ))}

                {patient.panels.map((panel) => (
                  <div key={panel.panel} className="px-4 py-2.5">
                    <p className="text-sm font-medium">{panel.label}</p>
                    {/* This is where a clinician learns the falls panel opened
                        because of a fall recorded last visit. */}
                    <p className="text-xs text-muted">
                      opened by {panel.trigger.replace(/_/g, ' ')} ·{' '}
                      {new Date(panel.opened_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Core assessments do not wait for a diagnosis: they are
              cross-disease and apply to every patient regardless of label.
              Only the module-specific instruments need one, which is why a
              first visit that ends undiagnosed can still collect something. */}
          <section className="rounded-xl border border-line bg-surface">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Assessments</h2>
            </header>

            <div className="grid gap-px bg-line sm:grid-cols-2">
              <div className="bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Core — available now
                </p>
                <ul className="mt-2 space-y-1">
                  {patient.assessments.core.map((assessment) => (
                    <li key={assessment.code} className="flex items-baseline gap-2 text-sm">
                      <span className="font-medium">{assessment.label}</span>
                      <span className="text-xs text-muted">{assessment.domain}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  These apply to every patient and can begin before a diagnosis exists.
                </p>
              </div>

              <div className="bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Module-specific
                </p>

                {patient.assessments.module.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {patient.assessments.module.map((assessment) => (
                      <li key={assessment.module} className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium">{assessment.instrument}</span>
                        <span className="text-xs text-muted">{assessment.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    {patient.diagnosis
                      ? 'This diagnosis opens no module-specific instrument.'
                      : 'A diagnosis opens the module set. The core set above does not wait for it.'}
                  </p>
                )}
              </div>
            </div>

            <p className="border-t border-line px-4 py-2 text-xs text-muted">
              Listed, not yet administrable — the instruments themselves arrive in the next slice.
            </p>
          </section>
        </div>
      )}
    </AppShell>
  );
}
