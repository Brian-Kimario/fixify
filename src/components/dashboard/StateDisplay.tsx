'use client';

import { Pill } from '@/components/ui/Pill';

interface StateDisplayProps {
  state: string;
  label?: string;
}

/**
 * StateDisplay - Renders a state with appropriate color coding
 * Consolidates state logic across all dashboards
 */
export function StateDisplay({ state, label }: StateDisplayProps) {
  let tone: 'neutral' | 'teal' | 'amber' | 'danger' | 'success' = 'neutral';

  if (state.includes('FAILED') || state.includes('DISPUTED') || state.includes('ERROR')) {
    tone = 'danger';
  } else if (state.includes('PENDING') || state.includes('ASSIGNED') || state.includes('REVIEW') || state.includes('AWAITING')) {
    tone = 'amber';
  } else if (state.includes('PAID') || state.includes('CLOSED') || state.includes('DELIVERED') || state.includes('COMPLETED')) {
    tone = 'success';
  } else if (state.includes('PROCESSING') || state.includes('IN_PROGRESS')) {
    tone = 'teal';
  }

  return <Pill tone={tone}>{state.replace(/_/g, ' ')}</Pill>;
}
