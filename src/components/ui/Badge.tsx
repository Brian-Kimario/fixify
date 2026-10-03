import React from 'react';

export type JobState =
  | 'REQUESTED'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'INSPECTION'
  | 'AWAITING_APPROVAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYMENT_PENDING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REJECTED'
  | 'SUSPENDED';

interface BadgeProps {
  state?: JobState | string;
  label?: string;
  variant?: 'neutral' | 'teal' | 'blue' | 'clay' | 'ochre' | 'success' | 'danger';
  size?: 'xs' | 'sm' | 'base';
  dot?: boolean;
  className?: string;
}

export function Badge({
  state,
  label,
  variant,
  size = 'xs',
  dot = false,
  className = '',
}: BadgeProps) {
  // Map domain job states to semantic color variants
  let computedVariant: 'neutral' | 'teal' | 'blue' | 'clay' | 'ochre' | 'success' | 'danger' = variant || 'neutral';
  let displayLabel = label || state?.replace(/_/g, ' ') || '';

  if (state && !variant) {
    switch (state) {
      case 'REQUESTED':
      case 'MATCHING':
        computedVariant = 'blue';
        break;
      case 'ASSIGNED':
      case 'ACCEPTED':
        computedVariant = 'teal';
        break;
      case 'ON_THE_WAY':
      case 'ARRIVED':
        computedVariant = 'teal';
        dot = true;
        break;
      case 'INSPECTION':
        computedVariant = 'ochre';
        break;
      case 'AWAITING_APPROVAL':
        computedVariant = 'clay';
        dot = true;
        break;
      case 'IN_PROGRESS':
        computedVariant = 'teal';
        dot = true;
        break;
      case 'COMPLETED':
      case 'CLOSED':
        computedVariant = 'success';
        break;
      case 'PAYMENT_PENDING':
        computedVariant = 'ochre';
        break;
      case 'DISPUTED':
      case 'CANCELLED':
      case 'REJECTED':
      case 'SUSPENDED':
        computedVariant = 'danger';
        break;
      default:
        computedVariant = 'neutral';
    }
  }

  const variantStyles = {
    neutral: 'bg-paper-2 text-ink-3 border-line',
    teal: 'bg-teal-soft text-teal border-teal/20',
    blue: 'bg-blue-soft text-blue border-blue/20',
    clay: 'bg-clay-soft text-clay border-clay/20',
    ochre: 'bg-ochre-soft text-ochre border-ochre/20',
    success: 'bg-success-soft text-success border-success/20',
    danger: 'bg-danger-soft text-danger border-danger/20',
  };

  const dotColors = {
    neutral: 'bg-ink-4',
    teal: 'bg-teal',
    blue: 'bg-blue',
    clay: 'bg-clay',
    ochre: 'bg-ochre',
    success: 'bg-success',
    danger: 'bg-danger',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    base: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-wider rounded-md border ${variantStyles[computedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[computedVariant]} ${
            state === 'ON_THE_WAY' || state === 'AWAITING_APPROVAL' || state === 'IN_PROGRESS'
              ? 'motion-safe:animate-pulse'
              : ''
          }`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
