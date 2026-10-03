'use client';

type MetricTone = 'neutral' | 'teal' | 'amber' | 'danger';

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
  onClick?: () => void;
}

/**
 * Metric - Displays a single metric with label, value, and detail
 * Can be clickable (button) or static (div)
 * Used in dashboards to show KPIs and statistics
 */
export function Metric({ label, value, detail, tone = 'neutral', onClick }: MetricProps) {
  const content = (
    <>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-ink-4">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-bold tracking-[-0.05em] ${
          tone === 'danger' ? 'text-danger' : tone === 'amber' ? 'text-ochre' : tone === 'teal' ? 'text-teal' : 'text-ink'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-3">{detail}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="border-r border-b border-line p-5 text-left transition hover:bg-porcelain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
      >
        {content}
      </button>
    );
  }

  return <div className="border-r border-b border-line p-5">{content}</div>;
}

/**
 * MetricGrid - Container for displaying multiple metrics in a grid
 * Typically 2-5 columns depending on screen size
 */
interface MetricGridProps {
  children: React.ReactNode;
}

export function MetricGrid({ children }: MetricGridProps) {
  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-line bg-paper shadow-brand-soft sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </section>
  );
}
