'use client';

import React, { type ReactNode } from 'react';

interface ErrorStateProps {
  /**
   * Error title
   */
  title: string;
  /**
   * Error description or message
   */
  description: string;
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
    loading?: boolean;
  };
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /**
   * Error code for reference
   */
  errorCode?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ErrorState - Actionable error display
 * 
 * Shows error with:
 * - Clear title and description
 * - Optional icon for visual distinction
 * - Primary action (retry, contact support, etc.)
 * - Secondary action (go back, home, etc.)
 * - Error code for debugging
 * 
 * @example
 * <ErrorState
 *   title="Payment failed"
 *   description="Your card was declined. Please try another payment method."
 *   errorCode="ERR_PAYMENT_001"
 *   action={{ label: 'Retry', onClick: handleRetry }}
 *   secondaryAction={{ label: 'Go back', onClick: handleBack }}
 * />
 */
export function ErrorState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  errorCode,
  className = '',
}: ErrorStateProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAction = async () => {
    if (!action || isLoading) return;
    setIsLoading(true);
    try {
      await action.onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-danger/20 bg-danger-soft p-12 text-center ${className}`}
      role="alert"
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 h-12 w-12 text-danger opacity-80">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="font-display text-lg font-bold text-danger">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 max-w-md text-sm text-ink-3">
        {description}
      </p>

      {/* Error code (if provided) */}
      {errorCode && (
        <p className="mt-3 text-xs font-mono text-ink-4">
          Error: {errorCode}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
        {action && (
          <button
            onClick={handleAction}
            disabled={isLoading || action.loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-paper transition-all hover:shadow-md hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
            aria-label={action.label}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                    opacity="0.75"
                  />
                </svg>
              </>
            ) : null}
            {action.label}
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
 * NetworkErrorState - Specific error state for network/connection issues
 */
export function NetworkErrorState({
  onRetry,
  className = '',
}: {
  onRetry: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Connection lost"
      description="We couldn't reach our servers. Check your internet connection and try again."
      errorCode="ERR_NETWORK"
      action={{ label: 'Retry', onClick: onRetry }}
      className={className}
      icon={
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.332a9 9 0 11-4.08-15.3m8.066 4.986a1 1 0 10-1.414-1.414M19.5 4.5a1 1 0 10-1.414-1.414"
          />
        </svg>
      }
    />
  );
}

/**
 * NotFoundState - 404 error display
 */
export function NotFoundState({
  onGoHome,
  onGoBack,
  className = '',
}: {
  onGoHome: () => void;
  onGoBack?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      errorCode="ERR_404"
      action={{ label: 'Go home', onClick: onGoHome }}
      secondaryAction={
        onGoBack ? { label: 'Go back', onClick: onGoBack } : undefined
      }
      className={className}
      icon={
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
    />
  );
}

/**
 * PermissionErrorState - Authorization/access denied error
 */
export function PermissionErrorState({
  onGoHome,
  onContactSupport,
  className = '',
}: {
  onGoHome: () => void;
  onContactSupport?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Access denied"
      description="You don't have permission to access this resource."
      errorCode="ERR_FORBIDDEN"
      action={{ label: 'Go home', onClick: onGoHome }}
      secondaryAction={
        onContactSupport
          ? { label: 'Contact support', onClick: onContactSupport }
          : undefined
      }
      className={className}
      icon={
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
    />
  );
}
