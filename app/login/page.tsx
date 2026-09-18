'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AuthShell from '@/components/AuthShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      const user = await login({ email, password, remember });

      // An account that never finished verification lands on the code form
      // whatever its role. Admins then go to account administration: they hold
      // no clinical permissions, so the clinician dashboard would only refuse
      // them.
      if (! user.email_verified_at) {
        router.push('/verify-email');
      } else {
        router.push(user.role === 'admin' ? '/admin' : '/');
      }
    } catch (error) {
      const failure = toFormFailure(error);
      setErrors(failure.errors);
      setStatus(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline="A Centre of Excellence"
      blurb="Sign in to continue to the Movement Disorder Registry. Access is limited to
             authorised clinical and research staff."
    >
      <h2 className="mb-6 text-center text-lg font-semibold text-brand-green">Sign In</h2>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          error={errors.email?.[0]}
        />

        <div>
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            error={errors.password?.[0]}
          />
          <p className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs text-brand-green hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-line accent-[var(--brand-green)]"
          />
          Remember me
        </label>

        {status && <p className="text-sm text-brand-red">{status}</p>}

        <PrimaryButton disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log In'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Accounts are created by invitation. Ask the registry administrator if you need access.
      </p>
    </AuthShell>
  );
}
