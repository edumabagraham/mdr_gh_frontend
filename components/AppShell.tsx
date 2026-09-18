import { ReactNode } from 'react';
import AppHeader from './AppHeader';
import CrestWatermark from './CrestWatermark';

/** Chrome for every signed-in screen: the header, the crest, the footer. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <CrestWatermark />

        <main className="relative w-full flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>

      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Komfo Anokye Teaching Hospital, Kumasi. Movement Disorder
        Registry (MDR KATH).
      </footer>
    </div>
  );
}
