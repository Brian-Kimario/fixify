import React from 'react';
import { isJobState, stateLabel, stateTone, type JobState, type JobStateTone } from '@/lib/jobs/states';

/* ─────────────────────────────────────────────────────────────────────────────
   Badge
───────────────────────────────────────────────────────────────────────────── */
type BadgeVariant = JobStateTone;

interface BadgeProps {
  /** Job state — drives colour and label when `variant`/`label` are not set */
  state?: JobState | string;
  /** Explicit display label — defaults to humanised `state` */
  label?: string;
  /** Explicit color variant — overrides `state` auto-colour */
  variant?: BadgeVariant;
  /** Badge size */
  size?: 'xs' | 'sm' | 'base';
  /** Show an animated pulsing dot for active states */
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-paper-2 text-ink-3 border-line',
  teal:    'bg-teal-soft text-teal border-teal/20',
  blue:    'bg-blue-soft text-blue border-blue/20',
  clay:    'bg-clay-soft text-clay border-clay/20',
  ochre:   'bg-ochre-soft text-ochre border-ochre/20',
  success: 'bg-success-soft text-success border-success/20',
  danger:  'bg-danger-soft text-danger border-danger/20',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-4',
  teal:    'bg-teal',
  blue:    'bg-blue',
  clay:    'bg-clay',
  ochre:   'bg-ochre',
  success: 'bg-success',
  danger:  'bg-danger',
};

const sizeStyles = {
  xs:   'px-2 py-0.5 text-[10px]',
  sm:   'px-2.5 py-1 text-xs',
  base: 'px-3 py-1 text-sm',
};

const activePulseStates: ReadonlySet<string> = new Set(['on_the_way', 'in_progress', 'quote_pending']);

/**
 * Badge — status / category label chip
 *
 * Pass `state` for automatic job-status colouring, or `variant` to override.
 *
 * @example
 * <Badge state="in_progress" />
 * <Badge label="Plumbing" variant="teal" size="sm" />
 */
export function Badge({
  state,
  label,
  variant,
  size = 'xs',
  dot = false,
  className = '',
}: BadgeProps) {
  const computedVariant: BadgeVariant =
    variant ?? (state ? stateTone(state) : 'neutral');

  const displayLabel = label ?? (state ? (isJobState(state) ? stateLabel(state) : state.replace(/_/g, ' ')) : '');

  const shouldPulse = activePulseStates.has(state ?? '');

  const showDot = dot || activePulseStates.has(state ?? '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-wider rounded-base border ${variantStyles[computedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[computedVariant]} ${shouldPulse ? 'motion-safe:animate-pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CategoryBadge — semantic chip for service categories
───────────────────────────────────────────────────────────────────────────── */
interface CategoryBadgeProps {
  label: string;
  /** Tailwind colour key or predefined palette */
  color?: 'teal' | 'blue' | 'ochre' | 'clay' | 'neutral';
  className?: string;
}

/**
 * CategoryBadge — for service category labels (Plumbing, Electrical, etc.)
 *
 * @example
 * <CategoryBadge label="Plumbing" color="blue" />
 */
export function CategoryBadge({
  label,
  color = 'neutral',
  className = '',
}: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[color]} border ${className}`}
    >
      {label}
    </span>
  );
}
