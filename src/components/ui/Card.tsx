import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-panel border border-line rounded-lg p-6 md:p-8
        shadow-md transition-all duration-200
        hover:shadow-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
}
