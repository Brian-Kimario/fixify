'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}

/**
 * EmptyState — Professional dashboard empty state
 * Shown when no jobs are available. Provides next action guidance.
 * Accessibility: semantic structure with ARIA labels.
 */
export function EmptyState({
  title = 'No jobs available right now',
  description = 'Check back soon for new job opportunities in your area, or update your availability and service preferences.',
  icon,
  ctaHref = '/professional/profile',
  ctaLabel = 'Update my profile',
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center bg-[#FFFEFA] border-2 border-dashed border-[#D9DED8] rounded-[22px] px-8 py-16 text-center"
      role="region"
      aria-label="No available jobs"
    >
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#E2EEE9] flex items-center justify-center">
          {icon || (
            <Briefcase className="w-8 h-8 text-[#176B5B]" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-xl font-bold text-[#18211F] mb-2">{title}</h2>

      {/* Explanation */}
      <p className="text-sm text-[#5A6661] max-w-sm mb-8 leading-relaxed">
        {description}
      </p>

      {/* Primary CTA */}
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#176B5B] hover:bg-[#0D5144] text-white text-sm font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
      >
        <Briefcase className="w-4 h-4" aria-hidden="true" />
        {ctaLabel}
      </Link>
    </div>
  );
}
