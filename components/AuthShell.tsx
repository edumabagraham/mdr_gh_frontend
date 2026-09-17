import { ReactNode } from 'react';
import BrandMark from './BrandMark';
import CrestWatermark from './CrestWatermark';

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
      <CrestWatermark />

      <div
        className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center
                   gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:flex-row lg:items-center
                   lg:justify-between lg:gap-24 xl:gap-32 2xl:max-w-[1700px]"
      >
        <section className="w-full max-w-md lg:max-w-xl lg:flex-1 2xl:max-w-2xl">
          <BrandMark />
          <h1
            className="mt-6 text-2xl font-bold tracking-tight text-brand-red sm:mt-8 sm:text-3xl
                       2xl:text-4xl"
          >
            {headline}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted 2xl:max-w-md 2xl:text-base">
            {blurb}
          </p>
        </section>

        <section
          className="w-full max-w-md shrink-0 rounded-xl border border-line bg-surface p-6 shadow-sm
                     sm:p-8 2xl:max-w-lg 2xl:p-10"
        >
          {children}
        </section>
      </div>

      <footer className="relative border-t border-line px-5 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
