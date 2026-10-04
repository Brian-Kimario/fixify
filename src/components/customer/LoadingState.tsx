'use client';

import React from 'react';

/**
 * LoadingState — Skeleton card showing placeholder content while fetching
 * Uses Tailwind's animate-pulse for shimmer effect
 */
export function LoadingState() {
  return (
    <div className="space-y-4">
      {/* Skeleton header */}
      <div className="bg-[#F7F4EC] rounded-lg p-6 animate-pulse">
        <div className="flex items-start gap-4">
          {/* Avatar placeholder */}
          <div className="w-16 h-16 rounded-full bg-[#18211F]/10"></div>

          {/* Text placeholders */}
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-[#18211F]/10 rounded w-1/2"></div>
            <div className="h-4 bg-[#18211F]/10 rounded w-1/3"></div>
            <div className="h-4 bg-[#18211F]/10 rounded w-2/3"></div>
          </div>
        </div>

        {/* Button placeholder */}
        <div className="mt-6 h-10 bg-[#176B5B]/20 rounded w-32"></div>
      </div>

      {/* Additional skeleton cards */}
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#FFFEFA] border border-[#F7F4EC] rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-[#18211F]/10 rounded w-2/3 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[#18211F]/10 rounded w-full"></div>
              <div className="h-4 bg-[#18211F]/10 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
