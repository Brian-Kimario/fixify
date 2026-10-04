'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Mutation state management: idle, submitting, success, error
 * Used for forms, async actions, etc.
 */

export type MutationState = 'idle' | 'submitting' | 'success' | 'error';

interface MutationStatusProps {
  state: MutationState;
  successMessage?: string;
  errorMessage?: string;
  onDismiss?: () => void;
}

/**
 * MutationStatus — Shows submitting spinner, success confirmation, or error message
 * Used in forms after submission. Respects prefers-reduced-motion.
 */
export function MutationStatus({
  state,
  successMessage = 'Changes saved successfully',
  errorMessage = 'Something went wrong. Please try again.',
  onDismiss,
}: MutationStatusProps) {
  if (state === 'idle') return null;

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg"
      role={state === 'error' ? 'alert' : 'status'}
      aria-live={state === 'submitting' ? 'polite' : 'assertive'}
    >
      {state === 'submitting' && (
        <>
          <Loader2 className="w-5 h-5 text-[#176B5B] animate-spin motion-reduce:animate-none" />
          <span className="text-sm text-[#18211F] font-medium">Saving…</span>
        </>
      )}

      {state === 'success' && (
        <>
          <CheckCircle className="w-5 h-5 text-[#176B5B] flex-shrink-0" />
          <span className="text-sm text-[#18211F] font-medium flex-1">{successMessage}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-[#5A6661] hover:text-[#18211F] underline"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
        </>
      )}

      {state === 'error' && (
        <>
          <AlertCircle className="w-5 h-5 text-[#A9523D] flex-shrink-0" />
          <span className="text-sm text-[#18211F] font-medium flex-1">{errorMessage}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-[#5A6661] hover:text-[#18211F] underline"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * SubmitButtonWithState — Button that shows loading state and disables during submission
 */
interface SubmitButtonWithStateProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function SubmitButtonWithState({
  isSubmitting = false,
  loadingText = 'Saving…',
  children,
  disabled,
  ...props
}: SubmitButtonWithStateProps) {
  return (
    <button
      disabled={isSubmitting || disabled}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#176B5B] hover:bg-[#0D5144] disabled:bg-[#176B5B]/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
      {...props}
    >
      {isSubmitting && (
        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
      )}
      {isSubmitting ? loadingText : children}
    </button>
  );
}
