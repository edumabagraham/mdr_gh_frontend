'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Certainty,
  CERTAINTY_LABELS,
  getPatientRecord,
  getVocabulary,
  PatientRecord,
  recordDiagnosis,
  Vocabulary,
} from '@/lib/patients';
import { toFormFailure } from '@/lib/form-errors';
import AppShell from '@/components/AppShell';
import FormField from '@/components/FormField';
import SelectField from '@/components/SelectField';
import PrimaryButton from '@/components/PrimaryButton';

export default function DiagnosePage() {
  const params = useParams<{ registryNo: string }>();
  const registryNo = params.registryNo;
  const router = useRouter();

  const { data: patient } = useSWR<PatientRecord>(['patient', registryNo], () =>
    getPatientRecord(registryNo)
  );
  const { data: vocabulary } = useSWR<Vocabulary>('diagnosis-vocabulary', getVocabulary, {
    revalidateOnFocus: false,
  });

  const [code, setCode] = useState('');
  const [certainty, setCertainty] = useState<string>('probable');
  const [diagnosedOn, setDiagnosedOn] = useState(new Date().toISOString().slice(0, 10));
  const [rationale, setRationale] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRevision = Boolean(patient?.diagnosis);

  const chosen = useMemo(
    () =>
      vocabulary?.groups
        .flatMap((group) => group.diagnoses)
        .find((diagnosis) => diagnosis.code === code),
    [vocabulary, code]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      await recordDiagnosis(registryNo, {
        code,
        certainty: certainty as Certainty,
        diagnosed_on: diagnosedOn,
        criteria_set: chosen?.criteria_set ?? null,
        rationale: rationale || undefined,
      });

      router.push(`/patients/${registryNo}`);
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs text-muted">{registryNo}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {isRevision ? 'Revise diagnosis' : 'Record diagnosis'}
        </h1>

        {isRevision && patient?.diagnosis && (
          <p className="mt-1 text-sm text-muted">
            Currently {patient.diagnosis.label}, set {patient.diagnosis.diagnosed_on}. Recording a
            new diagnosis supersedes it — the existing one stays on the record with its rationale.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl border border-line bg-surface p-6"
          noValidate
        >
          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
              Diagnosis<span className="ml-0.5 text-brand-red">*</span>
            </label>
            <select
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={`w-full rounded-md border bg-field px-3 py-2.5 text-sm outline-none
                          transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                          ${errors.code ? 'border-brand-red' : 'border-line'}`}
            >
              <option value="">Select a diagnosis</option>
              {vocabulary?.groups.map((group) => (
                <optgroup key={group.module} label={group.label}>
                  {group.diagnoses.map((diagnosis) => (
                    <option key={diagnosis.code} value={diagnosis.code}>
                      {diagnosis.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.code && <p className="mt-1.5 text-sm text-brand-red">{errors.code[0]}</p>}
            {chosen && (
              <p className="mt-1.5 text-xs text-muted">
                Opens the {vocabulary?.groups.find((g) => g.module === chosen.module)?.label} module
                {chosen.criteria_set
                  ? ` · criteria ${chosen.criteria_set} (checklist to follow; the set is recorded now)`
                  : ' · no published criteria set'}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              id="certainty"
              label="Diagnostic certainty"
              required
              value={certainty}
              onChange={setCertainty}
              options={(vocabulary?.certainties ?? []).map((value) => ({
                value,
                label: CERTAINTY_LABELS[value],
              }))}
              error={errors.certainty?.[0]}
            />
            <FormField
              id="diagnosed_on"
              label="Date diagnosed"
              type="date"
              required
              value={diagnosedOn}
              onChange={setDiagnosedOn}
              error={errors.diagnosed_on?.[0]}
            />
          </div>

          <div>
            <label htmlFor="rationale" className="mb-1.5 block text-sm font-medium">
              Rationale
              {isRevision && <span className="ml-0.5 text-brand-red">*</span>}
            </label>
            <textarea
              id="rationale"
              rows={3}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder={
                isRevision
                  ? 'Why the diagnosis is changing — this is as clinically useful as the label itself.'
                  : 'Optional for a first diagnosis.'
              }
              className={`w-full rounded-md border bg-field px-3 py-2.5 text-sm outline-none
                          transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                          ${errors.rationale ? 'border-brand-red' : 'border-line'}`}
            />
            {errors.rationale && (
              <p className="mt-1.5 text-sm text-brand-red">{errors.rationale[0]}</p>
            )}
          </div>

          {status && <p className="text-sm text-brand-red">{status}</p>}

          <div className="flex items-center gap-3">
            <div className="w-48">
              <PrimaryButton disabled={submitting || !code}>
                {submitting ? 'Saving…' : isRevision ? 'Revise diagnosis' : 'Record diagnosis'}
              </PrimaryButton>
            </div>
            <Link href={`/patients/${registryNo}`} className="text-sm text-muted hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
