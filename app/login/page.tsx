'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Axios from 'axios';
import { login, ValidationErrorResponse } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (error) {
      // TypeScript types a caught error as `unknown`, so a type guard is
      // required before reading error.response.
      if (Axios.isAxiosError<ValidationErrorResponse>(error)) {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else if (error.response) {
          setStatus(`Login failed with status ${error.response.status}.`);
          console.error('Login error:', error.response.status, error.response.data);
        } else {
          setStatus('Could not reach the server. Is php artisan serve running?');
        }
      } else {
        setStatus('Something unexpected went wrong.');
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto mt-24 w-full max-w-sm px-6">
      <h1 className="mb-8 text-2xl font-medium">Log in</h1>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="w-full rounded border border-neutral-600 bg-transparent px-3 py-2
                       focus:border-neutral-300 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-500">{errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-600 bg-transparent px-3 py-2
                       focus:border-neutral-300 focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-500">{errors.password[0]}</p>
          )}
        </div>

        {status && <p className="text-sm text-red-500">{status}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-white px-4 py-2 text-black
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-400">
        No account yet?{' '}
        <Link href="/register" className="underline">
          Create one
        </Link>
      </p>
    </main>
  );
}