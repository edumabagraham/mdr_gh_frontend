import { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  count: number;
  /** Shown in place of the body when the section has nothing in it. */
  emptyNote: string;
  /** Extra detail beside the count, e.g. "3 waiting". */
  detail?: string;
  children: ReactNode;
  className?: string;
}

/**
 * One dashboard panel.
 *
 * An empty section collapses to its heading and a single line rather than
 * rendering an empty container: on a normal Monday three of the four are
 * empty, and four empty boxes push the one useful list off the screen.
 */
export default function DashboardSection({
  title,
  count,
  emptyNote,
  detail,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface ${className}`}
      aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <h2
          id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-semibold tracking-tight"
        >
          {title}
          <span className="ml-2 rounded-full bg-field px-2 py-0.5 text-xs font-medium text-muted">
            {count}
          </span>
        </h2>
        {detail && <span className="text-xs text-muted">{detail}</span>}
      </header>

      {count === 0 ? (
        <p className="px-4 py-3 text-xs text-muted">{emptyNote}</p>
      ) : (
        <div className="divide-y divide-line">{children}</div>
      )}
    </section>
  );
}
