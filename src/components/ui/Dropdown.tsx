'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  label?: string;
}

/**
 * Dropdown - Accessible select dropdown
 * Uses native HTML select for best accessibility
 */
export const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(
  ({ options, placeholder, error, label, className = '', id, ...props }, ref) => {
    const inputId = id || `dropdown-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`min-h-10 rounded-xl border bg-porcelain px-3 py-2 text-sm outline-none transition ${
            error
              ? 'border-danger/50 bg-danger-soft/30 focus:border-danger focus:ring-2 focus:ring-danger/10'
              : 'border-line-strong focus:border-teal focus:ring-4 focus:ring-teal/10'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';
