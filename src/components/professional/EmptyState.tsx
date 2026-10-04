'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

/**
 * EmptyState: Renders when section has no data
 * Accessibility: semantic HTML with proper headings
 */
export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="p-8 text-center">
      {icon && (
        <div className="w-10 h-10 mx-auto rounded-full bg-[#E2EEE9] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      {!icon && (
        <div className="w-10 h-10 mx-auto rounded-full bg-[#E2EEE9] flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-[#176B5B]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      )}
      <h3 className="text-sm font-bold text-[#18211F] mb-1">{title}</h3>
      <p className="text-xs text-[#5A6661] max-w-sm mx-auto">{description}</p>
    </div>
  );
}
