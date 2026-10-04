'use client';

import React, { type ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   EmptyState
───────────────────────────────────────────────────────────────────────────── */
interface EmptyStateProps {
  /** Short heading — what is empty */
  title: string;
  /** One-sentence explanation or next-step cue */
  body: string;
  /** Optional primary CTA */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional secondary CTA / link */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Optional illustration / icon slot */
  illustration?: ReactNode;
  /** Compact version — less padding, no illustration */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState — displayed when a list or section has no data
 *
 * @example
 * <EmptyState
 *   title="No active repairs"
 *   body="Start a repair request to get matched with a professional."
 *   action={{ label: 'Start a repair', onClick: () => router.push('/customer/bookings/new') }}
 * />
 */
export function EmptyState({
  title,
  body,
  action,
  secondaryAction,
  illustration,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-base border border-dashed border-line-strong bg-porcelain text-center',
        compact ? 'px-6 py-8' : 'px-8 py-12',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={title}
    >
      {illustration && !compact && (
        <div className="mx-auto mb-4 h-12 w-12 text-ink-4">{illustration}</div>
      )}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-3">{body}</p>

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center rounded-base bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition-all duration-200 hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-base border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyStateContent — compact variant without extra padding, for use inside tables / cards
 */
export function EmptyStateContent({
  title,
  body,
  action,
  className = '',
}: Pick<EmptyStateProps, 'title' | 'body' | 'action' | 'className'>) {
  return <EmptyState title={title} body={body} action={action} compact className={className} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LoadingState
───────────────────────────────────────────────────────────────────────────── */
interface LoadingStateProps {
  /** Shown under the spinner */
  label?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to fill the full container height */
  fullHeight?: boolean;
  className?: string;
}

const spinnerSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * LoadingState — spinner with optional label for async data fetching
 *
 * @example
 * if (loading) return <LoadingState label="Fetching properties…" />
 */
export function LoadingState({
  label = 'Loading…',
  size = 'md',
  fullHeight = false,
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3',
        fullHeight ? 'min-h-[50vh]' : 'py-16',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label={label}
    >
      <svg
        className={`animate-spin text-teal ${spinnerSizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <p className="text-sm text-ink-3">{label}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SkeletonRow — placeholder row for table loading states
───────────────────────────────────────────────────────────────────────────── */
interface SkeletonRowProps {
  columns?: number;
  rows?: number;
}

/**
 * SkeletonRow — shimmer placeholder rows while table data loads
 */
export function SkeletonRows({ columns = 4, rows = 5 }: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} aria-hidden="true">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div
                className={`h-4 animate-pulse rounded-sm bg-sand ${colIdx === 0 ? 'w-3/4' : 'w-1/2'}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
