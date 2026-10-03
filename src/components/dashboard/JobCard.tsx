'use client';

import { ReactNode } from 'react';

interface JobCardProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
  elevated?: boolean;
}

/**
 * JobCard - Standard card for displaying job/booking information
 * Used across all dashboards for consistent layout
 */
export function JobCard({ title, subtitle, eyebrow, children, elevated = false }: JobCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-line ${elevated ? 'bg-ink text-paper' : 'bg-paper'} shadow-brand-soft`}
    >
      {eyebrow && (
        <div className={elevated ? 'bg-ink/80 p-6 md:p-7' : 'border-b border-line bg-porcelain p-6 md:p-7'}>
          <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${elevated ? 'text-[#9cd5c5]' : 'text-teal'}`}>
            {eyebrow}
          </p>
          <h2 className={`mt-2 font-display text-3xl font-bold tracking-[-0.05em] ${elevated ? '' : 'text-ink'}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-2 text-sm ${elevated ? 'text-white/70' : 'text-ink-3'}`}>{subtitle}</p>
          )}
        </div>
      )}
      {children && <div className={`p-6 md:p-7 ${!eyebrow && 'border-t border-line'}`}>{children}</div>}
    </div>
  );
}

/**
 * JobCardRow - Horizontal layout for job cards
 */
interface JobCardRowProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}

export function JobCardRow({ children, columns = 2 }: JobCardRowProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
  };

  return <div className={`grid gap-6 ${colClass[columns]}`}>{children}</div>;
}
