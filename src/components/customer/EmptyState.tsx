'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench } from 'lucide-react';

/**
 * EmptyState — Shown when customer has no active repairs
 * Encourages user to start a new repair request
 */
export function EmptyState() {
  return (
    <div className="bg-[#FFFEFA] border-2 border-dashed border-[#F7F4EC] rounded-lg p-12 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="bg-[#176B5B]/10 rounded-full p-4">
          <Wrench className="w-8 h-8 text-[#176B5B]" />
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-[#18211F] mb-2">No active repairs right now</h2>

      {/* Subheading */}
      <p className="text-[#18211F]/60 mb-8 text-lg">
        When you book a repair, it will appear here.
      </p>

      {/* CTA Button */}
      <Link
        href="/customer/bookings/new"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#176B5B] hover:bg-[#0D5144] text-white font-medium rounded-lg transition-colors"
      >
        Start a repair
      </Link>
    </div>
  );
}

export default EmptyState;
