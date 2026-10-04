'use client';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * ErrorState: Renders when a section fails to load
 * Provides retry mechanism for failed data fetches
 * Accessibility: error message clearly visible, retry button keyboard accessible
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 bg-[#FFFEFA] border border-[#F5E6E6] rounded-lg text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-[#F5E6E6] flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-[#9B3535]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-[#18211F] mb-1">Failed to load</h3>
      <p className="text-xs text-[#5A6661] max-w-sm mx-auto mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-bold text-[#176B5B] hover:text-[#0D5144] border border-[#176B5B] rounded-lg transition hover:bg-[#E2EEE9]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
