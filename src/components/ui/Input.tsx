import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-panel border border-line
            text-ink placeholder-line
            focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-line">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
