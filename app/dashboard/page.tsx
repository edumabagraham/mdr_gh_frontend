'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Axios from 'axios';
import { getUser, logout, User } from '@/lib/auth';
import BrandMark from '@/components/BrandMark';
import CrestWatermark from '@/components/CrestWatermark';

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
        {/* The bar runs the full width of the window, so the lockup and the
            log-out button sit against opposite edges. */}
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:gap-8 sm:px-8 sm:py-4">
          <BrandMark compact />
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-md border border-line px-3 py-2 text-xs font-medium text-muted
                       transition hover:border-brand-red hover:text-brand-red sm:px-3.5 sm:text-sm"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <CrestWatermark />

        <main className="relative w-full flex-1 px-4 py-8 sm:px-8 sm:py-10">
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {/* Only reached when something other than a plain 401 happened. Once auth
            is working reliably you can drop this branch and redirect always. */}
        {!loading && failure && (
          <div className="max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6">
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
          <div className="max-w-3xl rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8
                          2xl:max-w-4xl">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1
                          text-xs font-medium text-brand-green">
              Email verified
            </p>
          </div>
        )}
        </main>
      </div>

      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
