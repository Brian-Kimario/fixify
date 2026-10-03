'use client';

import { ReactNode } from 'react';

/**
 * SettingsSection – Container for a logical grouping of settings
 * Provides consistent card styling, heading, and content layout
 * Used across customer/professional/admin settings pages
 */

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isDanger?: boolean;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  isDanger = false,
  className = '',
}: SettingsSectionProps) {
  const dangerClasses = isDanger
    ? 'border-danger/30 bg-danger-soft'
    : 'border-line bg-paper';

  return (
    <div
      className={`rounded-lg border p-6 space-y-4 ${dangerClasses} ${className}`}
    >
      <div>
        <h2
          className={`font-display font-bold text-lg ${
            isDanger ? 'text-danger' : 'text-ink'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-line mt-1">{description}</p>
        )}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}
