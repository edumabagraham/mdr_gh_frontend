'use client';

import { useEffect, useState } from 'react';

/**
 * Persistent, unobtrusive connection state, with the number of writes still
 * waiting to reach the server.
 *
 * A clinician who cannot tell they are offline will read an empty search as
 * "this patient is not in the registry" and register a duplicate. That is the
 * whole reason this sits on screen at all times.
 */
export default function ConnectionIndicator({ queued = 0 }: { queued?: number }) {
  // Assume online until the browser says otherwise: navigator.onLine is not
  // readable during the server render, and flashing "offline" on every load
  // would train people to ignore it.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);

    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs
                  font-medium ${
                    online
                      ? 'border-line bg-surface text-muted'
                      : 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                  }`}
      title={online ? 'Connected to the registry' : 'Working offline — showing cached data only'}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-brand-green' : 'bg-brand-red'}`}
      />
      {online ? 'Online' : 'Offline'}
      {queued > 0 && (
        <span className="ml-0.5 rounded-full bg-brand-red px-1.5 text-[10px] text-white">
          {queued} queued
        </span>
      )}
    </span>
  );
}
