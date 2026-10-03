'use client';

import { Metric, MetricGrid } from '@/components/ui/Metric';

interface MetricItem {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'teal' | 'amber' | 'danger';
  onClick?: () => void;
}

interface MetricRowProps {
  metrics: MetricItem[];
  columns?: 2 | 3 | 4 | 5;
}

/**
 * MetricRow - Renders a row of metrics in a grid
 * Useful for dashboard overview sections
 */
export function MetricRow({ metrics }: MetricRowProps) {
  return (
    <MetricGrid>
      {metrics.map((metric) => (
        <Metric
          key={metric.label}
          label={metric.label}
          value={metric.value}
          detail={metric.detail}
          tone={metric.tone}
          onClick={metric.onClick}
        />
      ))}
    </MetricGrid>
  );
}
