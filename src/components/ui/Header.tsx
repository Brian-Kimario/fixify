import { type ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   DashboardHeader — top bar used inside customer / professional / admin layouts
───────────────────────────────────────────────────────────────────────────── */
interface DashboardHeaderProps {
  /** Page title */
  title: string;
  /** Short context label shown above the title in caps */
  eyebrow?: string;
  /** Breadcrumb or secondary text below the title */
  subtitle?: string;
  /** Slot for actions (buttons, menus) */
  actions?: ReactNode;
  /** Whether to show a bottom border */
  border?: boolean;
  className?: string;
}

/**
 * DashboardHeader — section heading bar for authenticated dashboard pages
 *
 * @example
 * <DashboardHeader
 *   eyebrow="Customer"
 *   title="My Properties"
 *   actions={<Button>Add property</Button>}
 * />
 */
export function DashboardHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  border = true,
  className = '',
}: DashboardHeaderProps) {
  return (
    <header
      className={[
        'flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6',
        border ? 'border-b border-line' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-4">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold text-ink truncate sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-3">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SectionHeader — lighter heading used inside cards / page sections
───────────────────────────────────────────────────────────────────────────── */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * SectionHeader — heading for a card or page section
 *
 * @example
 * <SectionHeader title="Active jobs" subtitle="2 in progress" actions={<Button size="sm">View all</Button>} />
 */
export function SectionHeader({
  title,
  subtitle,
  actions,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AppTopBar — fixed/sticky top navigation bar shell
───────────────────────────────────────────────────────────────────────────── */
interface AppTopBarProps {
  /** Left slot — typically the brand logo / wordmark */
  left?: ReactNode;
  /** Centre slot — optional nav links or page title */
  center?: ReactNode;
  /** Right slot — typically UserMenu or CTA */
  right?: ReactNode;
  /** Adds a bottom shadow to lift the bar */
  elevated?: boolean;
  className?: string;
}

/**
 * AppTopBar — sticky top navigation bar
 *
 * @example
 * <AppTopBar
 *   left={<BrandLockup />}
 *   right={<UserMenu user={user} />}
 *   elevated
 * />
 */
export function AppTopBar({
  left,
  center,
  right,
  elevated = false,
  className = '',
}: AppTopBarProps) {
  return (
    <nav
      className={[
        'sticky top-0 z-[1020] flex h-14 items-center justify-between gap-4 bg-paper px-4 sm:px-6',
        'border-b border-line',
        elevated ? 'shadow-xs' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="navigation"
      aria-label="Site navigation"
    >
      {left && <div className="flex shrink-0 items-center gap-3">{left}</div>}
      {center && <div className="min-w-0 flex-1 flex items-center justify-center">{center}</div>}
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </nav>
  );
}
