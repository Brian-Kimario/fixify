'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   PasswordField (M003 Applied)
───────────────────────────────────────────────────────────────────────────── */

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showToggleByDefault?: boolean;
}

/**
 * PasswordField — password input with show/hide toggle
 *
 * Architecture: Controlled wrapper component (M003 Applied)
 * - Manages isVisible state internally
 * - Renders Input with type={isVisible ? 'text' : 'password'}
 * - Toggle button uses Eye/EyeOff icons
 * - Respects prefers-reduced-motion for icon transitions
 *
 * @example
 * <PasswordField
 *   label="Password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   error={passwordError}
 * />
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, helperText, showToggleByDefault = false, className = '', id, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(showToggleByDefault);
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'password-field');

    const baseInputClass =
      'w-full rounded-base border border-line bg-paper text-ink placeholder:text-ink-4 ' +
      'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent ' +
      'disabled:opacity-50 disabled:cursor-not-allowed ' +
      'transition-all duration-200 motion-reduce:transition-none';

    const errorRing = error ? 'border-danger focus:ring-danger' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={fieldId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={isVisible ? 'text' : 'password'}
            className={[
              baseInputClass,
              'px-4 py-2.5 pr-10',
              errorRing,
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-hint` : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-4 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            disabled={props.disabled}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${fieldId}-hint`} className="mt-1 text-sm text-ink-4">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';
