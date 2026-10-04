'use client';

import { forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Shared token classes
───────────────────────────────────────────────────────────────────────────── */
const baseInputClass =
  'w-full rounded-base border border-line bg-paper text-ink placeholder:text-ink-4 ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-all duration-200 motion-reduce:transition-none';

const errorRing = 'border-danger focus:ring-danger';

/* ─────────────────────────────────────────────────────────────────────────────
   TextInput
───────────────────────────────────────────────────────────────────────────── */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Icon shown on the left inside the input */
  leadingIcon?: ReactNode;
  /** Icon / button shown on the right inside the input */
  trailingElement?: ReactNode;
}

/**
 * Input — single-line text input
 *
 * @example
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input label="Phone" error="Required" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leadingIcon, trailingElement, className = '', id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-4">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              baseInputClass,
              'px-4 py-2.5',
              leadingIcon ? 'pl-10' : '',
              trailingElement ? 'pr-10' : '',
              error ? errorRing : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
            {...props}
          />
          {trailingElement && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              {trailingElement}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-ink-4">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

/* ─────────────────────────────────────────────────────────────────────────────
   Select
───────────────────────────────────────────────────────────────────────────── */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

/**
 * Select — single-choice dropdown
 *
 * @example
 * <Select
 *   label="Category"
 *   options={[{ value: 'plumbing', label: 'Plumbing' }]}
 *   placeholder="Pick a category"
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, placeholder, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              baseInputClass,
              'px-4 py-2.5 pr-10 appearance-none',
              error ? errorRing : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-4">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-hint`} className="mt-1 text-sm text-ink-4">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

/* ─────────────────────────────────────────────────────────────────────────────
   Checkbox
───────────────────────────────────────────────────────────────────────────── */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

/**
 * Checkbox — accessible labelled checkbox
 *
 * @example
 * <Checkbox label="I agree to the terms" name="terms" />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    const checkId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            className={[
              'h-4 w-4 rounded-sm border border-line bg-paper text-teal cursor-pointer',
              'checked:bg-teal checked:border-teal',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              error ? 'border-danger' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${checkId}-error` : description ? `${checkId}-desc` : undefined}
            {...props}
          />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={checkId} className="cursor-pointer text-sm font-medium text-ink">
            {label}
          </label>
          {description && (
            <p id={`${checkId}-desc`} className="mt-0.5 text-sm text-ink-4">
              {description}
            </p>
          )}
          {error && (
            <p id={`${checkId}-error`} className="mt-0.5 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

/* ─────────────────────────────────────────────────────────────────────────────
   Radio
───────────────────────────────────────────────────────────────────────────── */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

/**
 * RadioGroup — a group of mutually exclusive radio buttons
 *
 * @example
 * <RadioGroup
 *   name="role"
 *   label="Account type"
 *   options={[
 *     { value: 'customer', label: 'Customer' },
 *     { value: 'professional', label: 'Professional' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={`w-full ${className}`}>
      {label && (
        <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      )}
      <div className="space-y-2">
        {options.map((opt) => {
          const radioId = `${name}-${opt.value}`;
          return (
            <div key={opt.value} className="flex gap-3">
              <div className="flex h-5 items-center">
                <input
                  type="radio"
                  id={radioId}
                  name={name}
                  value={opt.value}
                  checked={value === opt.value}
                  disabled={opt.disabled}
                  onChange={() => onChange?.(opt.value)}
                  className={[
                    'h-4 w-4 border border-line bg-paper text-teal cursor-pointer',
                    'checked:bg-teal checked:border-teal',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-150',
                  ].join(' ')}
                />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={radioId}
                  className={`cursor-pointer text-sm font-medium ${opt.disabled ? 'opacity-50' : 'text-ink'}`}
                >
                  {opt.label}
                </label>
                {opt.description && (
                  <p className="mt-0.5 text-sm text-ink-4">{opt.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Textarea
───────────────────────────────────────────────────────────────────────────── */
export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * TextareaField — multi-line text input
 *
 * @example
 * <TextareaField label="Describe the issue" rows={4} />
 */
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            baseInputClass,
            'px-4 py-2.5 resize-y min-h-[6rem]',
            error ? errorRing : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-sm text-ink-4">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
TextareaField.displayName = 'TextareaField';
