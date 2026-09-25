import { ReactNode } from 'react';
import AppHeader from './AppHeader';
import CrestWatermark from './CrestWatermark';

interface AppShellProps {
  children: ReactNode;
  /** False on admin screens, which have no patient search or registration. */
  clinicalTools?: boolean;
  /**
   * False on data-entry screens. Brief 0 asks for high contrast because these
   * screens are used on modest laptops in brightly lit rooms, and a crest
   * behind a column of form fields costs legibility for no gain.
   */
  watermark?: boolean;
}

/** Chrome for every signed-in screen: the header, the crest, the footer. */
export default function AppShell({
  children,
  clinicalTools = true,
  watermark = true,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader clinicalTools={clinicalTools} />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {watermark && <CrestWatermark />}

        {/* The bar spans the window; the content sits centred within it. */}
        <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>

      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
