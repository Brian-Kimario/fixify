'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

/**
 * FormInput - Text input field with validation support
 * Handles error states, helper text, and accessible labels
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, helperText, label, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`min-h-10 rounded-xl border bg-porcelain px-3 py-2 text-sm outline-none transition ${
            error
              ? 'border-danger/50 bg-danger-soft/30 focus:border-danger focus:ring-2 focus:ring-danger/10'
              : 'border-line-strong focus:border-teal focus:ring-4 focus:ring-teal/10'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-ink-4">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
