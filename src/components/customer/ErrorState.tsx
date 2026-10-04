'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * ErrorState — Shown when data fetch fails
 * Displays error message and retry button
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-[#FFFEFA] border-l-4 border-[#A9523D] rounded-lg p-6">
      {/* Header with icon */}
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <AlertCircle className="w-6 h-6 text-[#A9523D]" />
        </div>

        <div className="flex-1">
          {/* Heading */}
          <h3 className="text-lg font-semibold text-[#18211F] mb-1">Couldn't load your dashboard</h3>

          {/* Message */}
          <p className="text-[#18211F]/60 text-sm mb-4">
            {message || 'There was an issue loading your repairs. Please try again.'}
          </p>

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#176B5B] hover:bg-[#0D5144] text-white text-sm font-medium rounded transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
