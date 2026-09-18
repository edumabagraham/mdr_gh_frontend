'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { acceptInvitation } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AuthShell from '@/components/AuthShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * Turning an invitation into an account.
 *
 * This replaces self-registration. The role is carried by the invitation, so
 * nothing on this form decides what the new account may do — the fields here
 * are the person's own professional details.
 */
function AcceptInvitationForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [grade, setGrade] = useState('');
  const [department, setDepartment] = useState('');
  const [mdcNumber, setMdcNumber] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      await acceptInvitation({
        token,
        name,
        password,
        password_confirmation: passwordConfirmation,
        specialty: specialty || undefined,
        grade: grade || undefined,
        department: department || undefined,
        mdc_number: mdcNumber || undefined,
      });

      // Accepting proves someone had the link. The code proves they hold the
      // mailbox, and that is still required.
      router.push('/verify-email');
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        headline="Invitation Required"
        blurb="Accounts on the registry are created by invitation. Ask the registry administrator to send you one."
      >
        <h2 className="mb-2 text-center text-lg font-semibold text-brand-green">No invitation token</h2>
        <p className="mb-6 text-center text-sm text-muted">
          This page needs the link from your invitation email. Open that link rather than typing the
          address by hand.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-md border border-line px-4 py-2.5 text-center text-sm font-medium"
        >
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="Set Up Your Account"
      blurb="Choose a password and tell us your role in the service. Your access level was set by
             whoever invited you."
    >
      <h2 className="mb-6 text-center text-lg font-semibold text-brand-green">Accept Invitation</h2>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="name"
          label="Full Name"
          required
          autoComplete="name"
          value={name}
          onChange={setName}
          error={errors.name?.[0]}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password?.[0]}
        />
        <FormField
          id="password_confirmation"
          label="Confirm Password"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="specialty"
            label="Specialty"
            value={specialty}
            onChange={setSpecialty}
            error={errors.specialty?.[0]}
          />
          <FormField
            id="grade"
            label="Grade"
            value={grade}
            onChange={setGrade}
            error={errors.grade?.[0]}
          />
          <FormField
            id="department"
            label="Department"
            value={department}
            onChange={setDepartment}
            error={errors.department?.[0]}
          />
          <FormField
            id="mdc_number"
            label="MDC number"
            value={mdcNumber}
            onChange={setMdcNumber}
            error={errors.mdc_number?.[0]}
          />
        </div>

        {errors.token && <p className="text-sm text-brand-red">{errors.token[0]}</p>}
        {status && <p className="text-sm text-brand-red">{status}</p>}

        <PrimaryButton disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        The registry will email you a six-digit code to confirm this address before you can open any
        patient record.
      </p>
    </AuthShell>
  );
}

export default function AcceptInvitationPage() {
  // useSearchParams needs a boundary: without one the whole route opts out of
  // static rendering.
  return (
    <Suspense
      fallback={<main className="mt-24 px-6 text-center text-sm text-muted">Loading…</main>}
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
