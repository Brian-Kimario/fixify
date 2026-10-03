import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`bg-[var(--color-paper)] rounded-2xl border-2 border-dashed border-[var(--color-line)] p-12 text-center ${className}`}>
      {icon && <div className="mx-auto h-12 w-12 text-[var(--color-ink-4)] mb-4">{icon}</div>}
      <h3 className="font-[var(--font-display)] font-bold text-lg text-[var(--color-ink)]">{title}</h3>
      <p className="text-[var(--color-ink-3)] text-sm mt-1 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
