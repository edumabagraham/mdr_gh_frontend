'use client';

import { useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import FormField from '@/components/FormField';
import SelectField from '@/components/SelectField';
import DateField from '@/components/DateField';
import PrimaryButton from '@/components/PrimaryButton';
import { toFormFailure } from '@/lib/form-errors';
import { DateParts, EMPTY_DATE, formatDate, isDateEmpty, isFutureDate, toIsoDate } from '@/lib/dates';
import {
  createPatient,
  duplicateCheck,
  DuplicateCheckResponse,
  DuplicateDecision,
  FOLDER_ABSENT_REASONS,
  NewPatient,
  PatientIdentifierInput,
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
  age_within_2_years: 'about the same age',
  phone_match: 'same phone number',
};

/** A section heading, so a form this long still reads as a sequence of steps. */
function Fieldset({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-surface px-4 py-4 sm:px-5 sm:py-5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {note && <p className="mb-4 text-xs text-muted">{note}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

/**
 * Patient registration.
 *
 * Registration establishes identity, not clinical history: it answers "can we
 * find this person again, and are they already in here?" and nothing else.
 * Symptom onset, diagnosis and scales belong to the visit that follows — a
 * twenty-minute form at the front desk is a form that gets abandoned half
 * finished.
 *
 * Every registration passes through the duplicate check; the server refuses a
 * POST without a token from it. Duplicate records are the main way a registry
 * degrades, and the check is the only thing standing between a mistyped folder
 * number and a second record for the same person.
 */
export default function RegisterPatientPage() {
  const router = useRouter();

  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [sex, setSex] = useState('');

  const [dateOfBirth, setDateOfBirth] = useState<DateParts>(EMPTY_DATE);
  const [dobUnknown, setDobUnknown] = useState(false);
  const [estimatedAge, setEstimatedAge] = useState('');

  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [district, setDistrict] = useState('');

  const [folder, setFolder] = useState('');
  const [noFolder, setNoFolder] = useState(false);
  const [folderAbsentReason, setFolderAbsentReason] = useState('');
  const [nhis, setNhis] = useState('');

  const [check, setCheck] = useState<DuplicateCheckResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generated once and reused for every retry of this registration, so a
  // dropped connection followed by a resend cannot create a second patient.
  const clientRef = useRef<string | null>(null);

  const buildPayload = (): NewPatient => {
    clientRef.current ??= crypto.randomUUID();

    const identifiers: PatientIdentifierInput[] = [];
    if (!noFolder && folder.trim()) {
      identifiers.push({ system: 'folder', value: folder.trim(), is_primary: true });
    }
    if (nhis.trim()) {
      identifiers.push({ system: 'nhis', value: nhis.trim() });
    }

    return {
      client_ref: clientRef.current,
      family_name: familyName.trim(),
      given_name: givenName.trim(),
      other_names: otherNames.trim() || null,
      sex: sex as Sex,
      date_of_birth: dobUnknown ? null : toIsoDate(dateOfBirth),
      dob_estimated: dobUnknown,
      estimated_age: dobUnknown && estimatedAge ? Number(estimatedAge) : null,
      phone_primary: phonePrimary.trim() || null,
      phone_alt: phoneAlt.trim() || null,
      contact_name: contactName.trim() || null,
      contact_relationship: contactRelationship.trim() || null,
      contact_phone: contactPhone.trim() || null,
      residence_district: district.trim() || null,
      identifiers,
      folder_absent_reason: noFolder ? folderAbsentReason || null : null,
    };
  };

  /** Client-side checks, so obvious gaps do not cost a round trip. */
  const localErrors = (): Record<string, string[]> => {
    const found: Record<string, string[]> = {};

    if (!familyName.trim()) found.family_name = ['A family name is required.'];
    if (!givenName.trim()) found.given_name = ['A given name is required.'];
    if (!sex) found.sex = ['Select a sex.'];

    if (dobUnknown) {
      if (!estimatedAge) {
        found.estimated_age = ['Give an approximate age when the date of birth is unknown.'];
      }
    } else if (isDateEmpty(dateOfBirth)) {
      found.date_of_birth = ['Give a date of birth, or tick that it is unknown.'];
    } else {
      const iso = toIsoDate(dateOfBirth);

      if (iso === null) {
        found.date_of_birth = ['Give a complete date: day, month and year.'];
      } else if (isFutureDate(iso)) {
        found.date_of_birth = ['A date of birth cannot be in the future.'];
      }
    }

    if (noFolder && !folderAbsentReason) {
      found.folder_absent_reason = ['Say why there is no folder number.'];
    }

    if (!noFolder && !folder.trim()) {
      found['identifiers.0.value'] = [
        'Give the hospital folder number, or tick that there is none.',
      ];
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
      <AppShell watermark={false}>
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
                {dobUnknown ? `age about ${estimatedAge}` : formatDate(toIsoDate(dateOfBirth))}
                {district && ` · ${district}`}
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
                    {candidate.patient.date_of_birth
                      ? ` · ${formatDate(candidate.patient.date_of_birth)}`
                      : candidate.patient.age !== null && ` · age about ${candidate.patient.age}`}
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
    <AppShell watermark={false}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold tracking-tight">Register a patient</h1>
        <p className="mt-1 text-sm text-muted">
          Identity only. Symptom onset, diagnosis and assessments are recorded at the visit. The
          registry number is allocated by the server once the record is saved.
        </p>

        <form onSubmit={handleCheck} className="mt-6 space-y-4" noValidate>
          <Fieldset title="Who the patient is">
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

            {/* The escape hatch comes before the field it governs: offering it
                underneath leaves the clerk staring at a required date they do
                not have. */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dobUnknown}
                onChange={(event) => setDobUnknown(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--brand-green)]"
              />
              The patient does not know their date of birth
            </label>

            {dobUnknown ? (
              <div className="sm:max-w-[10rem]">
                <FormField
                  id="estimated_age"
                  label="Approximate age"
                  required
                  inputMode="numeric"
                  value={estimatedAge}
                  onChange={(value) => setEstimatedAge(value.replace(/\D/g, '').slice(0, 3))}
                  error={errors.estimated_age?.[0]}
                />
                <p className="mt-1.5 text-xs text-muted">
                  In years. Recorded as given and anchored to today, never turned into a date of
                  birth.
                </p>
              </div>
            ) : (
              <DateField
                id="date_of_birth"
                label="Date of birth"
                required
                value={dateOfBirth}
                onChange={setDateOfBirth}
                hint="Day, month, year — for example 02 03 1964."
                error={errors.date_of_birth?.[0]}
              />
            )}
          </Fieldset>

          <Fieldset
            title="How to reach the patient"
            note="Optional, and the single biggest determinant of whether this patient is still traceable in three years."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="phone_primary"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                value={phonePrimary}
                onChange={setPhonePrimary}
                error={errors.phone_primary?.[0]}
              />
              <FormField
                id="phone_alt"
                label="Alternate phone number"
                type="tel"
                autoComplete="off"
                value={phoneAlt}
                onChange={setPhoneAlt}
                error={errors.phone_alt?.[0]}
              />
              <FormField
                id="residence_district"
                label="District of residence"
                autoComplete="off"
                value={district}
                onChange={setDistrict}
                error={errors.residence_district?.[0]}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                id="contact_name"
                label="Alternate contact"
                autoComplete="off"
                value={contactName}
                onChange={setContactName}
                error={errors.contact_name?.[0]}
              />
              <FormField
                id="contact_relationship"
                label="Relationship"
                autoComplete="off"
                value={contactRelationship}
                onChange={setContactRelationship}
                error={errors.contact_relationship?.[0]}
              />
              <FormField
                id="contact_phone"
                label="Their phone number"
                type="tel"
                autoComplete="off"
                value={contactPhone}
                onChange={setContactPhone}
                error={errors.contact_phone?.[0]}
              />
            </div>
          </Fieldset>

          <Fieldset title="Hospital identifiers">
            <div className="grid gap-5 sm:grid-cols-2">
              {!noFolder && (
                <FormField
                  id="folder"
                  label="Hospital folder number"
                  required
                  autoComplete="off"
                  value={folder}
                  onChange={setFolder}
                  error={errors['identifiers.0.value']?.[0]}
                />
              )}

              <FormField
                id="nhis"
                label="NHIS membership number"
                autoComplete="off"
                value={nhis}
                onChange={setNhis}
                error={errors['identifiers.1.value']?.[0]}
              />
            </div>

            {/* Same shape as the date of birth above: one checkbox that both
                lifts the requirement and asks for the reason, so a clerk can
                never enter a number and a reason for its absence at once. */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noFolder}
                onChange={(event) => setNoFolder(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--brand-green)]"
              />
              There is no folder number for this patient
            </label>

            {noFolder && (
              <div className="sm:max-w-sm">
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
              </div>
            )}
          </Fieldset>

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
