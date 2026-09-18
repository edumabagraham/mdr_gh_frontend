'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { changePassword } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AppShell from '@/components/AppShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      await changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      setDone(true);
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold tracking-tight">Change your password</h1>
        <p className="mt-1 text-sm text-muted">
          You stay signed in here. Any other device signed in as you is signed out.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-line bg-surface p-6">
            <p className="text-sm font-medium text-brand-green">Your password has been changed.</p>
            <p className="mt-1 text-sm text-muted">
              Use the new one next time you sign in. Other devices will ask for it now.
            </p>
            <button
              onClick={() => setDone(false)}
              className="mt-4 rounded-md border border-line px-3 py-2 text-sm font-medium"
            >
              Change it again
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-xl border border-line bg-surface p-6"
            noValidate
          >
            <FormField
              id="current_password"
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              error={errors.current_password?.[0]}
            />
            <FormField
              id="password"
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={errors.password?.[0]}
            />
            <FormField
              id="password_confirmation"
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
            />

            {status && <p className="text-sm text-brand-red">{status}</p>}

            <PrimaryButton disabled={submitting}>
              {submitting ? 'Saving…' : 'Change password'}
            </PrimaryButton>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          Forgotten it instead?{' '}
          <Link href="/forgot-password" className="font-semibold text-brand-green hover:underline">
            Reset it by email
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
