'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Axios from 'axios';
import { getUser, logout, User } from '@/lib/auth';
import BrandMark from '@/components/BrandMark';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUser()
      .then((fetched) => {
        if (cancelled) return;

        // Registered but never verified: finish that before anything else.
        if (!fetched.email_verified_at) {
          router.replace('/verify-email');
          return;
        }

        setUser(fetched);
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

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <BrandMark compact />
          <button
            onClick={handleLogout}
            className="rounded-md border border-line px-3.5 py-2 text-sm font-medium text-muted
                       transition hover:border-brand-red hover:text-brand-red"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {/* Only reached when something other than a plain 401 happened. Once auth
            is working reliably you can drop this branch and redirect always. */}
        {!loading && failure && (
          <div className="rounded-xl border border-line bg-surface p-6">
            <p className="text-sm text-brand-red">{failure}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 rounded-md border border-line px-4 py-2 text-sm"
            >
              Back to login
            </button>
          </div>
        )}

        {!loading && !failure && user && (
          <div className="rounded-xl border border-line bg-surface p-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1
                          text-xs font-medium text-brand-green">
              Email verified
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
