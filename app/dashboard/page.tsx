'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Axios from 'axios';
import { getUser, logout, User } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUser()
      .then((fetched) => {
        if (!cancelled) setUser(fetched);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        // While debugging, the status code is the whole answer:
        //   401 → the session cookie is not reaching Laravel
        //   419 → CSRF token missing or mismatched
        //   500 → a server-side error; read storage/logs/laravel.log
        if (Axios.isAxiosError(error)) {
          const code = error.response?.status;
          console.error('getUser failed:', code, error.response?.data);

          if (code === 401) {
            router.push('/login');
            return;
          }

          setFailure(
            code
              ? `Could not load your account (status ${code}). Check the terminal running php artisan serve.`
              : 'Could not reach the server. Is php artisan serve running?'
          );
        } else {
          console.error(error);
          setFailure('Something unexpected went wrong.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return <main className="mt-24 px-6 text-center text-neutral-400">Loading…</main>;
  }

  // Only reached when something other than a plain 401 happened. Once auth is
  // working reliably you can drop this branch and redirect on every failure.
  if (failure) {
    return (
      <main className="mx-auto mt-24 w-full max-w-md px-6">
        <p className="text-red-500">{failure}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 rounded border border-neutral-600 px-4 py-2"
        >
          Back to login
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-24 w-full max-w-md px-6">
      <h1 className="text-2xl font-medium">Welcome, {user?.name}</h1>
      <p className="mt-1 text-neutral-400">{user?.email}</p>

      <button
        onClick={handleLogout}
        className="mt-8 rounded bg-white px-4 py-2 text-black"
      >
        Log out
      </button>
    </main>
  );
}