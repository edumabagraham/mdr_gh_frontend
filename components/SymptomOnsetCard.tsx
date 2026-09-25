'use client';

import { useState, FormEvent } from 'react';
import {
  PatientRecord,
  SIDE_OF_ONSET_OPTIONS,
  updateSymptomOnset,
} from '@/lib/patients';
import { formatDate, toIsoDate } from '@/lib/dates';
import { toFormFailure } from '@/lib/form-errors';
import FormField from '@/components/FormField';
import SelectField from '@/components/SelectField';

type Precision = 'year' | 'month' | 'exact';

const PRECISIONS: { value: Precision; label: string }[] = [
  { value: 'year', label: 'A year' },
  { value: 'month', label: 'A month and year' },
  { value: 'exact', label: 'An exact date' },
];

/**
 * Where an approximate answer lands inside the period it names.
 *
 * Mid-period, not the first of it. A year given as "2019" is equally likely to
 * be any day in 2019, so 1 July is wrong by six months at worst while
 * 1 January is wrong by up to twelve and always in the same direction — which
 * would bias every disease duration in the registry upward.
 */
function isoForPrecision(precision: Precision, year: string, month: string, day: string) {
  if (precision === 'exact') return toIsoDate({ day, month, year });
  if (precision === 'month') return toIsoDate({ day: '15', month, year });
  return toIsoDate({ day: '01', month: '07', year });
}

/**
 * Symptom onset — step 3 of the encounter, and load-bearing.
 *
 * Disease duration, the banner, age-at-onset category and every
 * time-to-milestone analysis derive from this one date. It is one of the few
 * fields where a rough answer is fine and a missing answer is expensive, so
 * the card asks for the precision the patient actually has rather than
 * demanding a day nobody remembers, and says plainly what is lost while it
 * stays empty.
 */
export default function SymptomOnsetCard({
  patient,
  onSaved,
}: {
  patient: PatientRecord;
  onSaved: () => void;
}) {
  const recorded = patient.symptom_onset_on;

  const [editing, setEditing] = useState(false);
  const [precision, setPrecision] = useState<Precision>('year');
  const [year, setYear] = useState(recorded?.slice(0, 4) ?? '');
  const [month, setMonth] = useState(recorded?.slice(5, 7) ?? '');
  const [day, setDay] = useState(recorded?.slice(8, 10) ?? '');
  const [firstSymptom, setFirstSymptom] = useState(patient.first_symptom ?? '');
  const [side, setSide] = useState(patient.side_of_onset ?? '');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const iso = isoForPrecision(precision, year, month, day);

    if (iso === null) {
      setErrors({ symptom_onset_on: ['Give at least the year symptoms began.'] });
      return;
    }

    setErrors({});
    setStatus(null);
    setSaving(true);

    try {
      await updateSymptomOnset(patient.registry_no, {
        symptom_onset_on: iso,
        symptom_onset_estimated: precision !== 'exact',
        first_symptom: firstSymptom.trim() || null,
        side_of_onset: side || null,
      });

      setEditing(false);
      onSaved();
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`rounded-xl border bg-surface ${
        recorded ? 'border-line' : 'border-amber-500/50'
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">History — symptom onset</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              recorded
                ? 'border border-line hover:border-brand-green hover:text-brand-green'
                : 'bg-brand-red text-white hover:bg-brand-red-dark'
            }`}
          >
            {recorded ? 'Amend' : 'Record onset'}
          </button>
        )}
      </header>

      <div className="px-4 py-3">
        {!editing && recorded && (
          <>
            <p className="text-sm">
              <span className="font-medium">{formatDate(recorded)}</span>
              <span className="text-muted">
                {patient.symptom_onset_estimated ? ' · approximate' : ' · exact date'}
                {patient.first_symptom && ` · first symptom ${patient.first_symptom}`}
                {patient.side_of_onset && ` · ${patient.side_of_onset} onset`}
              </span>
            </p>
            {patient.diagnosis?.disease_duration_years !== undefined &&
              patient.diagnosis?.disease_duration_years !== null && (
                <p className="mt-1 text-xs text-muted">
                  Disease duration {patient.diagnosis.disease_duration_years.toFixed(1)} years,
                  derived from this date.
                </p>
              )}
          </>
        )}

        {!editing && !recorded && (
          <p className="text-sm text-muted">
            Not recorded. Disease duration, age-at-onset and every time-to-milestone figure
            depend on this date — an approximate year is far better than nothing.
          </p>
        )}

        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <SelectField
              id="onset_precision"
              label="How precisely can the patient date the first symptom?"
              value={precision}
              onChange={(value) => setPrecision(value as Precision)}
              options={PRECISIONS}
            />

            <div className="flex items-end gap-2">
              {precision === 'exact' && (
                <div>
                  <label htmlFor="onset_day" className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
                    Day
                  </label>
                  <input
                    id="onset_day"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="DD"
                    value={day}
                    onChange={(event) => setDay(event.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-16 rounded-md border border-line bg-field px-3 py-2.5 text-center
                               text-sm tabular-nums outline-none focus:border-brand-green
                               focus:ring-2 focus:ring-brand-green/20"
                  />
                </div>
              )}

              {precision !== 'year' && (
                <div>
                  <label htmlFor="onset_month" className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
                    Month
                  </label>
                  <input
                    id="onset_month"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="MM"
                    value={month}
                    onChange={(event) => setMonth(event.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-16 rounded-md border border-line bg-field px-3 py-2.5 text-center
                               text-sm tabular-nums outline-none focus:border-brand-green
                               focus:ring-2 focus:ring-brand-green/20"
                  />
                </div>
              )}

              <div>
                <label htmlFor="onset_year" className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
                  Year
                </label>
                <input
                  id="onset_year"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  value={year}
                  onChange={(event) => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-24 rounded-md border border-line bg-field px-3 py-2.5 text-center
                             text-sm tabular-nums outline-none focus:border-brand-green
                             focus:ring-2 focus:ring-brand-green/20"
                />
              </div>
            </div>

            {errors.symptom_onset_on?.[0] && (
              <p className="text-sm text-brand-red">{errors.symptom_onset_on[0]}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="first_symptom"
                label="First symptom"
                value={firstSymptom}
                onChange={setFirstSymptom}
                error={errors.first_symptom?.[0]}
              />
              <SelectField
                id="side_of_onset"
                label="Side of onset"
                value={side}
                onChange={setSide}
                options={SIDE_OF_ONSET_OPTIONS}
                placeholder="Not recorded"
                error={errors.side_of_onset?.[0]}
              />
            </div>

            {status && <p className="text-sm text-brand-red">{status}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white
                           transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save onset'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium
                           transition hover:border-brand-red hover:text-brand-red"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
