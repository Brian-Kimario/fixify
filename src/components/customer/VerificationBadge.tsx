'use client';

export type VerificationStatus = 'verified' | 'pending' | 'not_verified' | 'rejected';

interface VerificationBadgeProps {
  status?: VerificationStatus | null;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<VerificationStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  icon: string;
}> = {
  verified: {
    label: 'Identity Verified',
    bgColor: 'bg-success-soft',
    textColor: 'text-ink',
    dotColor: 'bg-success',
    icon: '✓',
  },
  pending: {
    label: 'Verification Pending',
    bgColor: 'bg-ochre-soft',
    textColor: 'text-ink',
    dotColor: 'bg-ochre motion-safe:animate-pulse',
    icon: '⏱',
  },
  not_verified: {
    label: 'Not Verified',
    bgColor: 'bg-paper-2',
    textColor: 'text-ink-3',
    dotColor: 'bg-ink-4',
    icon: '○',
  },
  rejected: {
    label: 'Verification Rejected',
    bgColor: 'bg-danger-soft',
    textColor: 'text-ink',
    dotColor: 'bg-danger',
    icon: '✕',
  },
};

/**
 * VerificationBadge - Displays identity verification status
 * Shows verification state with semantic colors and icons
 * Supports multiple verification statuses with appropriate visual indicators
 */
export function VerificationBadge({
  status = 'not_verified',
  size = 'md',
  className = '',
}: VerificationBadgeProps) {
  if (!status) {
    status = 'not_verified';
  }

  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-lg border
        ${config.bgColor} ${config.textColor}
        font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${status === 'pending' ? 'border-ochre/30' : 'border-current/20'}
        ${className}
      `}
      title={config.label}
      role="status"
      aria-label={config.label}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </div>
  );
}
