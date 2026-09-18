'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandMark from './BrandMark';
import ConnectionIndicator from './ConnectionIndicator';
import { logout } from '@/lib/auth';
import { looksLikeRegistryNumber, searchPatients, SearchResponse } from '@/lib/registry';
import { toFormFailure } from '@/lib/form-errors';

/**
 * The bar every signed-in screen carries.
 *
 * Search lives here rather than on the dashboard because lookup is the first
 * step of every clinical encounter, and a clinician arriving from a ward
 * should not have to navigate home to find a patient.
 */
/**
 * `clinicalTools` turns off patient search and the register action. An admin
 * holds no clinical permissions, so those controls would only ever answer 403
 * — offering them is an invitation to a dead end.
 */
export default function AppHeader({ clinicalTools = true }: { clinicalTools?: boolean }) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // Debounced lookup. Two characters is too short to be a useful query and
  // long enough to hammer the trigram index from every keystroke.
  useEffect(() => {
    const trimmed = query.trim();

    const timer = setTimeout(async () => {
      if (trimmed.length < 3) {
        setResults(null);
        setFailure(null);
        return;
      }

      setSearching(true);
      setFailure(null);

      try {
        setResults(await searchPatients(trimmed));
        setOpen(true);
      } catch (error) {
        setResults(null);
        setFailure(toFormFailure(error).message ?? 'Search is unavailable.');
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close the panel on an outside click, the way every other combobox behaves.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);

    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();

    // A registry number identifies exactly one record, so skip the result list.
    if (looksLikeRegistryNumber(trimmed)) {
      router.push(`/patients/${trimmed.toUpperCase().replace(/\s/g, '-')}`);
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex w-full flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8">
        <Link href={clinicalTools ? '/' : '/admin'} className="shrink-0">
          <BrandMark compact />
        </Link>

        {clinicalTools && (
        <div ref={container} className="relative order-last w-full sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
          <form onSubmit={handleSubmit} role="search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => (results || failure) && setOpen(true)}
              placeholder="Search by name, registry number or folder number"
              aria-label="Search patients"
              className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm outline-none
                         transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                         sm:max-w-xl"
            />
          </form>

          {open && (
            <div
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-md
                         border border-line bg-surface shadow-lg sm:max-w-xl"
            >
              {searching && <p className="px-3 py-3 text-sm text-muted">Searching…</p>}

              {!searching && failure && (
                <p className="px-3 py-3 text-sm text-brand-red">{failure}</p>
              )}

              {!searching && !failure && results?.results.length === 0 && (
                <p className="px-3 py-3 text-sm text-muted">
                  No patient matches “{results.query}”.
                </p>
              )}

              {!searching &&
                !failure &&
                results?.results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/patients/${result.registry_no}`}
                    onClick={() => setOpen(false)}
                    className="block border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-field"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{result.name}</span>
                      <span className="font-mono text-xs text-muted">{result.registry_no}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {result.date_of_birth ?? 'DOB unknown'}
                      {result.identifiers[0] && ` · folder ${result.identifiers[0].value}`}
                      {result.status === 'merged' && result.merged_into && (
                        <span className="text-brand-red">
                          {' '}
                          · merged into {result.merged_into.registry_no}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <ConnectionIndicator />

          {clinicalTools && (
            <Link
              href="/patients/new"
              className="rounded-md bg-brand-red px-3 py-2 text-xs font-semibold text-white
                         transition hover:bg-brand-red-dark sm:text-sm"
            >
              Register patient
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="rounded-md border border-line px-3 py-2 text-xs font-medium text-muted
                       transition hover:border-brand-red hover:text-brand-red sm:text-sm"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
