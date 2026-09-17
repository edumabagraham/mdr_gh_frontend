'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth';
import { toFormFailure } from '@/lib/form-errors';
import AuthShell from '@/components/AuthShell';
import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Registering signs the user in, but the account is not verified yet:
      // the API has just mailed a six-digit code.
      router.push('/verify-email');
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
      headline="Join the Registry"
      blurb="Create an account to record and follow up patients seen in the movement disorder
             clinic. We will email you a code to confirm your address."
    >
      <h2 className="mb-6 text-center text-lg font-semibold text-brand-green">Create Account</h2>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="name"
          label="Full Name"
          autoComplete="name"
          required
          value={name}
          onChange={setName}
          error={errors.name?.[0]}
        />
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
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={setPassword}
          error={errors.password?.[0]}
        />
        <FormField
          id="password_confirmation"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
        />

        {status && <p className="text-sm text-brand-red">{status}</p>}

        <PrimaryButton disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand-green hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
