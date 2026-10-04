'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * ErrorState — Professional dashboard error display
 * User-friendly error message with retry capability.
 * Accessibility: ARIA live region for error announcements.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="p-6 bg-[#FFFEFA] border-l-4 border-[#A9523D] rounded-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-[#A9523D]" aria-hidden="true" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#18211F] mb-1">
            Couldn't load your jobs
          </h3>

          <p className="text-[#18211F]/60 text-sm mb-4">
            {message ||
              'There was an issue loading your available jobs. Please try again.'}
          </p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#176B5B] hover:bg-[#0D5144] text-white text-sm font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
