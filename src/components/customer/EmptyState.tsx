'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench } from 'lucide-react';

/**
 * EmptyState — Shown when customer has no data or no active repairs.
 * Provides a clear next action (Start a repair).
 */
export function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center bg-[#FFFEFA] border-2 border-dashed border-[#D9DED8] rounded-[22px] px-8 py-16 text-center"
      role="region"
      aria-label="No active repairs"
    >
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#E2EEE9] flex items-center justify-center">
          <Wrench className="w-8 h-8 text-[#176B5B]" aria-hidden="true" />
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-xl font-bold text-[#18211F] mb-2">
        No active repairs right now
      </h2>

      {/* Explanation */}
      <p className="text-sm text-[#5A6661] max-w-sm mb-8 leading-relaxed">
        When you book a home repair, it will appear here with live status updates and professional
        contact info.
      </p>

      {/* Primary CTA */}
      <Link
        href="/customer/bookings/new"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#176B5B] hover:bg-[#0D5144] text-white text-sm font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
      >
        <Wrench className="w-4 h-4" aria-hidden="true" />
        Start your first repair
      </Link>

      {/* Secondary CTA */}
      <Link
        href="/customer/properties"
        className="mt-3 text-xs text-[#5A6661] hover:text-[#176B5B] underline-offset-2 hover:underline"
      >
        Manage my properties first
      </Link>
    </div>
  );
}

export default EmptyState;
