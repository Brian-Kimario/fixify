'use client';

import React, { type ReactNode } from 'react';

interface SuccessStateProps {
  /**
   * Success title/message
   */
  title: string;
  /**
   * Optional description or details
   */
  description?: string;
  /**
   * Optional icon/illustration
   */
  icon?: ReactNode;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /**
   * Show animated checkmark by default
   */
  showCheckmark?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SuccessState - Confirmation and success display
 * 
 * Shows success with:
 * - Animated checkmark (optional)
 * - Clear title and optional description
 * - Primary action (next step, continue, etc.)
 * - Secondary action (done, close, etc.)
 * 
 * Animation: 300ms fade-in, checkmark animates over 600ms
 * 
 * @example
 * <SuccessState
 *   title="Payment successful"
 *   description="Your invoice has been sent to your email."
 *   action={{ label: 'View invoice', onClick: handleView }}
 *   secondaryAction={{ label: 'Done', onClick: handleDone }}
 * />
 */
export function SuccessState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  showCheckmark = true,
  className = '',
}: SuccessStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-success/20 bg-success-soft p-12 text-center animate-in fade-in duration-300 ${className}`}
      role="status"
    >
      {/* Icon or Animated Checkmark */}
      {icon ? (
        <div className="mb-4 h-12 w-12 text-success">
          {icon}
        </div>
      ) : showCheckmark ? (
        <div className="mb-4 h-12 w-12 text-success animate-in zoom-in duration-600 delay-150">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ) : null}

      {/* Title */}
      <h3 className="font-display text-lg font-bold text-success animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 max-w-md text-sm text-ink-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
          {description}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 animate-in fade-in duration-300 delay-200 sm:flex-row sm:gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-6 py-2.5 text-sm font-semibold text-paper transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-label={action.label}
          >
            {action.label}
            <span aria-hidden="true">→</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:border-ink/30 hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ConfirmationCard - Small success confirmation (e.g., for toasts)
 */
interface ConfirmationCardProps {
  title: string;
  description?: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
  onClose?: () => void;
  className?: string;
}

export function ConfirmationCard({
  title,
  description,
  autoClose = true,
  autoCloseDuration = 3000,
  onClose,
  className = '',
}: ConfirmationCardProps) {
  React.useEffect(() => {
    if (!autoClose || !onClose) return;

    const timer = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDuration, onClose]);

  return (
    <div
      className={`inline-flex items-start gap-3 rounded-lg border border-success/20 bg-success-soft px-4 py-3 animate-in fade-in slide-in-from-top duration-300 ${className}`}
      role="status"
    >
      {/* Checkmark icon */}
      <svg
        className="h-5 w-5 flex-shrink-0 text-success mt-0.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="text-xs text-ink-3">{description}</p>
        )}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-success rounded"
          aria-label="Close confirmation"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}
    </div>
  );
}
