'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Toggle - Accessible switch/toggle component
 * Renders as checkbox with styled toggle appearance
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex items-center gap-3">
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          className={`h-6 w-11 cursor-pointer appearance-none rounded-full bg-line-strong transition checked:bg-teal ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={toggleId} className="cursor-pointer text-sm font-medium text-ink">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
