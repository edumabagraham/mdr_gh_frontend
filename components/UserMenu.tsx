'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logout, ROLE_LABELS, User } from '@/lib/auth';

/**
 * The account menu at the right of the bar.
 *
 * Initials rather than a photograph: the design brief rules out imagery, and a
 * clinical system has no business holding staff portraits it does not need.
 */
function initials(user: User): string {
  return user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, the way every other menu behaves.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);

    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5 transition
                   hover:border-brand-green sm:gap-2.5 sm:px-2.5"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/10
                     text-[11px] font-semibold text-brand-red"
        >
          {initials(user)}
        </span>

        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block truncate text-sm font-medium">{user.display_name}</span>
          <span className="block truncate text-[11px] text-muted">{ROLE_LABELS[user.role]}</span>
        </span>

        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border
                     border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-medium">{user.display_name}</p>
            <p className="truncate text-[11px] text-muted">{ROLE_LABELS[user.role]}</p>
          </div>

          <Link
            href="/account/password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm transition hover:bg-field"
          >
            Change password
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full border-t border-line px-4 py-2.5 text-left text-sm
                       text-brand-red transition hover:bg-field"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
