import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CircleAlert, ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import { RAIL_STEPS, STATE_META, isJobState, type JobStateTone } from '@/lib/jobs/states';
import type { VerificationNotice } from '@/lib/shell/rules';

/* Server-renderable building blocks for the role dashboards. Calls to action are links,
   so none of these need client JavaScript. */

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-medium text-ink-3">{eyebrow}</p>}
        <h1 className="mt-1 font-editorial text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-4xl">
          {title}
        </h1>
        {description && <div className="mt-2 max-w-2xl text-[15px] leading-6 text-ink-3">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  count,
  link,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  count?: number;
  link?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  const headingId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold text-ink">
            {title}
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-paper-2 px-2 text-xs font-semibold leading-5 text-ink-3">{count}</span>
            )}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
        </div>
        {link && (
          <Link
            href={link.href}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-teal hover:text-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {link.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-paper ${className}`}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center gap-2 text-sm text-ink-3">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-ink-3">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  secondary,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-line-strong bg-paper/60 text-center ${compact ? 'px-5 py-6' : 'px-6 py-10'}`}
    >
      {Icon && (
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper-2 text-ink-3">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-3">{body}</p>
      {(action || secondary) && (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {action && <LinkButton href={action.href}>{action.label}</LinkButton>}
          {secondary && (
            <LinkButton href={secondary.href} variant="secondary">
              {secondary.label}
            </LinkButton>
          )}
        </div>
      )}
    </div>
  );
}

const LINK_BUTTON = {
  primary: 'bg-teal text-paper hover:bg-teal-deep',
  secondary: 'border border-line bg-paper text-ink hover:bg-paper-2',
  quiet: 'text-teal hover:bg-teal-wash',
} as const;

export function LinkButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof LINK_BUTTON;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain ${LINK_BUTTON[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Six-step progress rail for a job, from RAIL_STEPS. Cancelled or unknown states render nothing. */
export function JobProgress({ state }: { state: string }) {
  if (!isJobState(state)) return null;
  const current = STATE_META[state].step;
  if (current === null) return null;
  const label = RAIL_STEPS.find((s) => s.step === current)?.label ?? '';

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Job progress"
        aria-valuemin={1}
        aria-valuemax={RAIL_STEPS.length}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${RAIL_STEPS.length}: ${label}`}
        className="flex gap-1"
      >
        {RAIL_STEPS.map((s) => (
          <span
            key={s.step}
            className={`h-1.5 flex-1 rounded-full ${s.step <= current ? 'bg-teal' : 'bg-paper-2'}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-4" aria-hidden="true">
        <span>{RAIL_STEPS[0].label}</span>
        <span>{RAIL_STEPS[RAIL_STEPS.length - 1].label}</span>
      </div>
    </div>
  );
}

const NOTICE_TONE = {
  ochre: { box: 'border-ochre/30 bg-ochre-soft', icon: 'text-ochre', Icon: ShieldAlert },
  blue: { box: 'border-blue/30 bg-blue-soft', icon: 'text-blue', Icon: ShieldCheck },
  danger: { box: 'border-danger/30 bg-danger-soft', icon: 'text-danger', Icon: CircleAlert },
} as const;

/** Banner explaining why a professional's account is locked. */
export function VerificationBanner({ notice }: { notice: VerificationNotice }) {
  const tone = NOTICE_TONE[notice.tone];
  return (
    <div className={`border-b ${tone.box}`} role="status">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 md:px-6">
        <tone.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink">{notice.title}</p>
          <p className="mt-0.5 leading-6 text-ink-2">{notice.body}</p>
        </div>
      </div>
    </div>
  );
}

const PILL_TONE: Record<JobStateTone, string> = {
  neutral: 'bg-paper-2 text-ink-3',
  teal: 'bg-teal-soft text-teal-deep',
  blue: 'bg-blue-soft text-blue',
  clay: 'bg-clay-soft text-clay',
  ochre: 'bg-ochre-soft text-ochre',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
};

export function StatusPill({ tone, children }: { tone: JobStateTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}
