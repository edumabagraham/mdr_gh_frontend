import { ReactNode } from 'react';
import BrandMark from './BrandMark';

interface AuthShellProps {
  /** The bold line under the wordmark, in crest red. */
  headline: string;
  /** One sentence of orientation under the headline. */
  blurb: string;
  /** The white card on the right. */
  children: ReactNode;
}

/**
 * The two-column frame every signed-out page shares: branding on the left,
 * a single white card on the right, and the hospital crest washed out behind
 * both of them.
 */
export default function AuthShell({ headline, blurb, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/logo.png')] bg-[length:640px_640px]
                   bg-center bg-no-repeat opacity-[0.04]"
      />

      <div
        className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center
                   gap-12 px-6 py-14 lg:flex-row lg:items-center lg:gap-20"
      >
        <section className="w-full max-w-md lg:flex-1">
          <BrandMark />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-brand-red">{headline}</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{blurb}</p>
        </section>

        <section className="w-full max-w-md rounded-xl border border-line bg-surface p-8 shadow-sm">
          {children}
        </section>
      </div>

      <footer className="relative border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
