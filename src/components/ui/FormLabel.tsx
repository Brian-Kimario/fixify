'use client';

import { LabelHTMLAttributes } from 'react';

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

/**
 * FormLabel - Accessible form label with optional/required indicators
 */
export function FormLabel({ required, optional, children, className = '', ...props }: FormLabelProps) {
  return (
    <label className={`text-sm font-semibold text-ink ${className}`} {...props}>
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
      {optional && <span className="ml-1 text-ink-4">(optional)</span>}
    </label>
  );
}
