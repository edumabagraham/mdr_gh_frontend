'use client';

import { useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import FormField from '@/components/FormField';
import SelectField from '@/components/SelectField';
import PrimaryButton from '@/components/PrimaryButton';
import { toFormFailure } from '@/lib/form-errors';
import {
  createPatient,
  duplicateCheck,
  DuplicateCheckResponse,
  DuplicateDecision,
  FOLDER_ABSENT_REASONS,
  NewPatient,
  Sex,
} from '@/lib/registry';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const REASON_LABELS: Record<string, string> = {
  identifier_match: 'same hospital identifier',
  name_similarity: 'similar name',
  dob_within_2_years: 'date of birth within 2 years',
  phone_match: 'same phone number',
};

/**
 * Patient registration.
 *
 * Registration always passes through the duplicate check — the server refuses
 * a POST without a token from it. Duplicate records are the main way a
 * registry degrades, and the check is the only thing standing between a
 * mistyped folder number and a second record for the same person.
 */
export default function RegisterPatientPage() {
  const router = useRouter();

  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobUnknown, setDobUnknown] = useState(false);
  const [age, setAge] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [folder, setFolder] = useState('');
  const [folderAbsentReason, setFolderAbsentReason] = useState('');

  const [check, setCheck] = useState<DuplicateCheckResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generated once and reused for every retry of this registration, so a
  // dropped connection followed by a resend cannot create a second patient.
  const clientRef = useRef<string | null>(null);

  const buildPayload = (): NewPatient => {
    clientRef.current ??= crypto.randomUUID();

    return {
      client_ref: clientRef.current,
      family_name: familyName.trim(),
      given_name: givenName.trim(),
      other_names: otherNames.trim() || null,
      sex: sex as Sex,
      date_of_birth: dobUnknown ? null : dateOfBirth || null,
      dob_estimated: dobUnknown,
      age: dobUnknown && age ? Number(age) : null,
      phone_primary: phonePrimary.trim() || null,
      identifiers: folder.trim()
        ? [{ system: 'folder', value: folder.trim(), is_primary: true }]
        : [],
      folder_absent_reason: folder.trim() ? null : folderAbsentReason || null,
    };
  };

  /** Client-side checks, so obvious gaps do not cost a round trip. */
  const localErrors = (): Record<string, string[]> => {
    const found: Record<string, string[]> = {};

    if (!familyName.trim()) found.family_name = ['A family name is required.'];
    if (!givenName.trim()) found.given_name = ['A given name is required.'];
    if (!sex) found.sex = ['Select a sex.'];

    if (dobUnknown && !age) {
      found.age = ['Give an approximate age when the date of birth is unknown.'];
    }

    if (!dobUnknown && !dateOfBirth) {
      found.date_of_birth = ['Give a date of birth, or tick that it is unknown.'];
    }

    if (!folder.trim() && !folderAbsentReason) {
      found.folder_absent_reason = ['Give a folder number, or say why there is none.'];
    }

    return found;
  };

  const register = async (decision: DuplicateDecision, token: string) => {
    setStatus(null);
    setSubmitting(true);

    try {
      const patient = await createPatient({
        ...buildPayload(),
        duplicate_check_token: token,
        duplicate_decision: decision,
      });

      router.push(`/patients/${patient.registry_no}`);
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
      setSubmitting(false);
    }
  };

  const handleCheck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = localErrors();

    if (Object.keys(found).length > 0) {
      setErrors(found);
      setStatus(null);
      return;
    }

    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      const result = await duplicateCheck(buildPayload());
      setCheck(result);

      // Nothing resembling this patient exists, so there is no decision for a
      // human to make; go straight through.
      if (result.verdict === 'clear') {
        await register('no_match', result.duplicate_check_token);
        return;
      }

      setSubmitting(false);
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
      setSubmitting(false);
    }
  };

  if (check && check.verdict !== 'clear') {
    const blocked = check.verdict === 'block';

    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div
            className={`rounded-xl border p-5 ${
              blocked ? 'border-brand-red/40 bg-brand-red/5' : 'border-line bg-surface'
            }`}
          >
            <h1 className="text-lg font-semibold tracking-tight">
              {blocked ? 'This patient is already registered' : 'Possible duplicate'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {blocked
                ? 'An existing record carries one of the hospital identifiers you entered. Registering again would split this patient’s history across two records.'
                : 'One or more records resemble the patient you are registering. Check them before continuing.'}
            </p>
          </div>

          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Being registered
              </p>
              <p className="mt-1 text-sm font-medium">
                {givenName} {familyName} {otherNames}
              </p>
              <p className="text-xs text-muted">
                {dobUnknown ? `age about ${age}` : dateOfBirth}
                {folder && ` · folder ${folder}`}
              </p>
            </div>

            {check.candidates.map((candidate) => (
              <div
                key={candidate.patient.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{candidate.patient.name}</p>
                  <p className="text-xs text-muted">
                    <span className="font-mono">{candidate.patient.registry_no}</span>
                    {candidate.patient.date_of_birth && ` · ${candidate.patient.date_of_birth}`}
                    {' · '}
                    {candidate.reasons.map((reason) => REASON_LABELS[reason] ?? reason).join(', ')}
                    {candidate.similarity !== undefined &&
                      ` · ${Math.round(candidate.similarity * 100)}% name match`}
                  </p>
                </div>
                <Link
                  href={`/patients/${candidate.patient.registry_no}`}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-medium
                             transition hover:border-brand-green hover:text-brand-green"
                >
                  Open this record
                </Link>
              </div>
            ))}
          </div>

          {status && <p className="text-sm text-brand-red">{status}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setCheck(null);
                setStatus(null);
              }}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium
                         transition hover:border-brand-red hover:text-brand-red"
            >
              Back to the form
            </button>

            {!blocked && (
              <button
                onClick={() => register('new_person_despite_match', check.duplicate_check_token)}
                disabled={submitting}
                className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white
                           transition hover:bg-brand-red-dark disabled:opacity-50"
              >
                {submitting ? 'Registering…' : 'This is a different person — register'}
              </button>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold tracking-tight">Register a patient</h1>
        <p className="mt-1 text-sm text-muted">
          The registry number is allocated by the server once the record is saved.
        </p>

        <form onSubmit={handleCheck} className="mt-6 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="family_name"
              label="Family name"
              required
              autoComplete="off"
              value={familyName}
              onChange={setFamilyName}
              error={errors.family_name?.[0]}
            />
            <FormField
              id="given_name"
              label="Given name"
              required
              autoComplete="off"
              value={givenName}
              onChange={setGivenName}
              error={errors.given_name?.[0]}
            />
            <FormField
              id="other_names"
              label="Other names"
              autoComplete="off"
              value={otherNames}
              onChange={setOtherNames}
              error={errors.other_names?.[0]}
            />
            <SelectField
              id="sex"
              label="Sex"
              required
              value={sex}
              onChange={setSex}
              options={SEX_OPTIONS}
              placeholder="Select"
              error={errors.sex?.[0]}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {dobUnknown ? (
              <FormField
                id="age"
                label="Approximate age in years"
                required
                inputMode="numeric"
                value={age}
                onChange={(value) => setAge(value.replace(/\D/g, '').slice(0, 3))}
                error={errors.age?.[0]}
              />
            ) : (
              <FormField
                id="date_of_birth"
                label="Date of birth"
                type="date"
                required
                value={dateOfBirth}
                onChange={setDateOfBirth}
                error={errors.date_of_birth?.[0]}
              />
            )}

            <FormField
              id="phone_primary"
              label="Phone number"
              type="tel"
              autoComplete="tel"
              value={phonePrimary}
              onChange={setPhonePrimary}
              error={errors.phone_primary?.[0]}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={dobUnknown}
              onChange={(event) => setDobUnknown(event.target.checked)}
              className="h-4 w-4 rounded border-line accent-[var(--brand-green)]"
            />
            The patient does not know their date of birth
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="folder"
              label="Hospital folder number"
              autoComplete="off"
              value={folder}
              onChange={setFolder}
              error={errors['identifiers.0.value']?.[0]}
            />

            {!folder.trim() && (
              <SelectField
                id="folder_absent_reason"
                label="Reason there is no folder number"
                required
                value={folderAbsentReason}
                onChange={setFolderAbsentReason}
                options={FOLDER_ABSENT_REASONS}
                placeholder="Select a reason"
                error={errors.folder_absent_reason?.[0]}
              />
            )}
          </div>

          {status && <p className="text-sm text-brand-red">{status}</p>}

          <div className="flex gap-3">
            <div className="w-full sm:w-64">
              <PrimaryButton disabled={submitting}>
                {submitting ? 'Checking…' : 'Check for duplicates'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
