'use client';

import { calculateMetrics } from '@/lib/data/support-tickets';

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
}

function MetricCard({ label, value, detail, tone = 'neutral' }: MetricCardProps) {
  const toneClasses = {
    neutral: 'text-ink',
    warning: 'text-ochre',
    success: 'text-success',
    danger: 'text-danger',
  };

  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink-4">{label}</p>
      <p className={`mt-3 font-display text-3xl font-bold tracking-[-0.05em] ${toneClasses[tone]}`}>
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-ink-3">{detail}</p>}
    </div>
  );
}

export function SupportMetrics() {
  const metrics = calculateMetrics();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Open Tickets"
        value={metrics.openTickets}
        detail="Awaiting action"
        tone={metrics.openTickets > 5 ? 'warning' : 'neutral'}
      />
      <MetricCard
        label="Avg Response"
        value={`${metrics.avgResponseTime}m`}
        detail="Time to first response"
        tone="success"
      />
      <MetricCard
        label="Resolution Rate"
        value={`${metrics.resolutionRate}%`}
        detail="Resolved vs total"
        tone={metrics.resolutionRate > 80 ? 'success' : 'warning'}
      />
      <MetricCard
        label="Escalations"
        value={`${metrics.escalationRate}%`}
        detail="High/critical priority"
        tone={metrics.escalationRate > 20 ? 'danger' : 'neutral'}
      />
    </div>
  );
}
