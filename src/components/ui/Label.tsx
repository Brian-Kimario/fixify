import { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

export function Label({
  children,
  htmlFor,
  className = '',
  required = false,
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        block text-sm font-medium text-ink
        ${className}
      `}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}
