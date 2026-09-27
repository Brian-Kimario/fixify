import { forwardRef, useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            min-h-11 w-full rounded-xl border bg-paper px-4 py-2.5
            text-ink placeholder:text-ink-4
            outline-none transition
            focus-visible:ring-4 focus-visible:ring-teal/15
            disabled:cursor-not-allowed disabled:bg-porcelain disabled:text-ink-4
            ${error ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15' : 'border-line-strong focus-visible:border-teal'}
            ${className}
          `}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText ? messageId : undefined}
          {...props}
        />
        {error && <p id={messageId} className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && (
          <p id={messageId} className="mt-1 text-sm text-ink-3">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
