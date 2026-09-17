'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { forgotPassword, resetPassword } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AuthShell from '@/components/AuthShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * Both halves of the forgotten-password flow live on this one page.
 *
 * The code is mailed rather than a link, so the user never leaves this tab —
 * which means the reset can be finished on a desktop even when the mail was
 * read on a phone, and there is no signed URL to leak through a referrer.
 */
type Step = 'request' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const response = await forgotPassword(email);

      // The API answers the same way for addresses it has never seen, so this
      // message must not be read as confirmation that an account exists.
      setNotice(response.message);
      setStep('reset');
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setNotice(null);
    setSubmitting(true);

    try {
      await resetPassword({
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });

      setStep('done');
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <AuthShell
        headline="Password Updated"
        blurb="Your new password is active. Any other device that was signed in as you has been
               signed out."
      >
        <h2 className="mb-2 text-center text-lg font-semibold text-brand-green">All set</h2>
        <p className="mb-6 text-center text-sm text-muted">
          Every session signed in as{' '}
          <span className="font-medium text-foreground">{email}</span> has been signed out. Log in
          with your new password.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-md bg-brand-red px-4 py-2.5 text-center text-sm
                     font-semibold text-white transition hover:bg-brand-red-dark"
        >
          Go to Login
        </Link>
      </AuthShell>
    );
  }

  if (step === 'reset') {
    return (
      <AuthShell
        headline="Choose a New Password"
        blurb="Enter the six-digit code from the email, then pick a password you have not used
               here before."
      >
        <h2 className="mb-2 text-center text-lg font-semibold text-brand-green">Reset Password</h2>
        <p className="mb-6 text-center text-sm text-muted">
          {notice ?? `Enter the code sent to ${email} and pick a new password.`}
        </p>

        <form onSubmit={handleReset} className="space-y-5" noValidate>
          <FormField
            id="code"
            label="Reset Code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            error={errors.code?.[0]}
            inputClassName="text-center text-lg tracking-[0.6em]"
          />
          <FormField
            id="password"
            label="New Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
            error={errors.password?.[0]}
          />
          <FormField
            id="password_confirmation"
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
          />

          {errors.email && <p className="text-sm text-brand-red">{errors.email[0]}</p>}
          {status && <p className="text-sm text-brand-red">{status}</p>}

          <PrimaryButton disabled={submitting || code.length < 6}>
            {submitting ? 'Saving…' : 'Reset Password'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="font-semibold text-brand-green hover:underline"
          >
            Use a different address, or send a new code
          </button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="Forgot Your Password?"
      blurb="Give us the address you registered with and we will email you a code for setting a
             new password."
    >
      <h2 className="mb-6 text-center text-lg font-semibold text-brand-green">Password Recovery</h2>

      <form onSubmit={handleRequest} className="space-y-5" noValidate>
        <FormField
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={setEmail}
          error={errors.email?.[0]}
        />

        {status && <p className="text-sm text-brand-red">{status}</p>}

        <PrimaryButton disabled={submitting}>
          {submitting ? 'Sending…' : 'Email Me a Code'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <button
          type="button"
          onClick={() => setStep('reset')}
          className="font-semibold text-brand-green hover:underline"
        >
          I already have a code
        </button>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        <Link href="/login" className="hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
