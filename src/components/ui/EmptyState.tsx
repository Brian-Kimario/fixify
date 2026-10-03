'use client';

interface EmptyStateProps {
  title: string;
  body: string;
}

/**
 * EmptyState - Displays a centered message when no content is available
 * Used in tables, lists, and content areas to provide context during empty states
 */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-[20px] border border-dashed border-line-strong bg-porcelain p-8 text-center">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      <p className="mt-2 text-sm text-ink-3">{body}</p>
    </div>
  );
}

/**
 * EmptyStateContent - For use within tables/sections where full padding is not needed
 * More compact than EmptyState
 */
export function EmptyStateContent({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-line-strong bg-porcelain p-8 text-center">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-3">{body}</p>
    </div>
  );
}
