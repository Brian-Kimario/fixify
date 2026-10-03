import { ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        bg-panel border border-line rounded-lg p-6 md:p-8
        shadow-md transition-all duration-200
        hover:shadow-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
