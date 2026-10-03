'use client';

import { ReactNode } from 'react';

type PillTone = 'neutral' | 'teal' | 'amber' | 'danger' | 'success' | 'green' | 'rust';

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}

export function Pill({ children, tone = 'neutral', className = '' }: PillProps) {
  const styles: Record<PillTone, string> = {
    neutral: 'bg-porcelain text-ink-3 border-line',
    teal: 'bg-teal-soft text-teal border-teal/20',
    amber: 'bg-ochre-soft text-ochre border-ochre/25',
    danger: 'bg-danger-soft text-danger border-danger/25',
    success: 'bg-success-soft text-success border-success/25',
    green: 'bg-success-soft text-success border-success/25',
    rust: 'bg-danger-soft text-danger border-danger/25',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * StatusPill - Specialized variant that determines tone based on state
 * Useful for displaying job states, payment states, or other status strings
 */
interface StatusPillProps {
  state: string;
}

export function StatusPill({ state }: StatusPillProps) {
  let tone: PillTone = 'neutral';

  if (state.includes('FAILED') || state.includes('DISPUTED') || state.includes('DANGER')) {
    tone = 'danger';
  } else if (
    state.includes('PENDING') ||
    state.includes('ASSIGNED') ||
    state.includes('REVIEW') ||
    state.includes('AMBER')
  ) {
    tone = 'amber';
  } else if (
    state.includes('PAID') ||
    state.includes('CLOSED') ||
    state.includes('DELIVERED') ||
    state.includes('SUCCESS') ||
    state.includes('COMPLETED')
  ) {
    tone = 'success';
  } else if (state.includes('TEAL')) {
    tone = 'teal';
  }

  return <Pill tone={tone}>{state.replace(/_/g, ' ')}</Pill>;
}
