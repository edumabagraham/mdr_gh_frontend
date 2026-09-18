'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Axios from 'axios';
import { getUser, resendVerificationCode, verifyEmail } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AuthShell from '@/components/AuthShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

/** Seconds to wait before the resend button becomes clickable again. */
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Who is this? The page is only reachable with a session, so the address the
  // code went to comes from the API rather than from a query parameter.
  useEffect(() => {
    let cancelled = false;

    getUser()
      .then((user) => {
        if (cancelled) return;

        if (user.email_verified_at) {
          router.replace('/');
          return;
        }

        setEmail(user.email);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        if (Axios.isAxiosError(error) && error.response?.status === 401) {
          router.replace('/login');
          return;
        }

        setStatus(toFormFailure(error).message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown === 0) return;

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setNotice(null);
    setSubmitting(true);

    try {
      await verifyEmail(code);
      router.push('/');
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    setErrors({});
    setStatus(null);
    setNotice(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);

    try {
      const response = await resendVerificationCode();
      setCode('');
      setNotice(response.message);
    } catch (error) {
      setStatus(toFormFailure(error).message);
    }
  }, []);

  return (
    <AuthShell
      headline="Confirm Your Email"
      blurb="The registry only mails clinical information to confirmed addresses, so we need to
             check this one belongs to you."
    >
      <h2 className="mb-2 text-center text-lg font-semibold text-brand-green">Check your email</h2>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          <p className="mb-6 text-center text-sm text-muted">
            We sent a six-digit code to{' '}
            <span className="font-medium text-foreground">{email}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField
              id="code"
              label="Verification Code"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              // Browsers paste all sorts of things into one-time-code fields;
              // keep the digits and drop the rest.
              onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              error={errors.code?.[0]}
              inputClassName="text-center text-lg tracking-[0.6em]"
            />

            {notice && <p className="text-sm text-brand-green">{notice}</p>}
            {status && <p className="text-sm text-brand-red">{status}</p>}

            <PrimaryButton disabled={submitting || code.length < 6}>
              {submitting ? 'Verifying…' : 'Verify Email'}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Nothing arrived?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="font-semibold text-brand-green hover:underline
                         disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
            </button>
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            Check the spam folder too — and note that a new code replaces the old one.
          </p>
        </>
      )}
    </AuthShell>
  );
}
