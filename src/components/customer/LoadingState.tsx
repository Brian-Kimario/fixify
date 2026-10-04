'use client';

import React from 'react';

/**
 * LoadingState — Skeleton card showing placeholder content while fetching
 * Accurate to the shape/size of the final CustomerDashboard content.
 * Respects prefers-reduced-motion.
 */
export function LoadingState() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading your dashboard…">
      {/* Greeting header skeleton */}
      <div className="space-y-2 animate-pulse motion-reduce:animate-none">
        <div className="h-3 bg-[#18211F]/10 rounded w-24" />
        <div className="h-8 bg-[#18211F]/10 rounded w-56" />
        <div className="h-4 bg-[#18211F]/10 rounded w-72" />
      </div>

      {/* Main grid skeleton (matches 7/5 column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column — Active Job + Problem Intake */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Job card skeleton */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] p-6 animate-pulse motion-reduce:animate-none">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#18211F]/8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#18211F]/10 rounded w-20" />
                <div className="h-5 bg-[#18211F]/10 rounded w-3/4" />
                <div className="h-4 bg-[#18211F]/10 rounded w-1/2" />
              </div>
              <div className="w-20 h-6 rounded-full bg-[#176B5B]/15 flex-shrink-0" />
            </div>
            {/* Progress steps skeleton */}
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                  <div className="w-8 h-8 rounded-full bg-[#18211F]/8" />
                  {i < 4 && <div className="flex-1 h-px bg-[#18211F]/8" />}
                </React.Fragment>
              ))}
            </div>
            <div className="h-10 bg-[#176B5B]/15 rounded-xl w-full" />
          </div>

          {/* Problem Intake skeleton */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] p-6 animate-pulse motion-reduce:animate-none">
            <div className="h-4 bg-[#18211F]/10 rounded w-1/3 mb-3" />
            <div className="h-3 bg-[#18211F]/8 rounded w-2/3 mb-5" />
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#18211F]/8 rounded-xl" />
              ))}
            </div>
            <div className="h-24 bg-[#18211F]/6 rounded-xl" />
          </div>
        </div>

        {/* Right column — Property card + Activity */}
        <div className="lg:col-span-5 space-y-5">
          {/* Property card skeleton */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] overflow-hidden animate-pulse motion-reduce:animate-none">
            <div className="h-36 bg-[#18211F]/10" />
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-[#18211F]/8 rounded-xl" />
                <div className="h-20 bg-[#18211F]/8 rounded-xl" />
              </div>
              <div className="h-px bg-[#D9DED8]" />
              <div className="h-3 bg-[#18211F]/8 rounded w-2/3" />
            </div>
          </div>

          {/* Activity list skeleton */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] p-5 space-y-4 animate-pulse motion-reduce:animate-none">
            <div className="h-4 bg-[#18211F]/10 rounded w-1/3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#18211F]/8 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#18211F]/8 rounded w-3/4" />
                  <div className="h-3 bg-[#18211F]/6 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Loading your dashboard…</span>
    </div>
  );
}

export default LoadingState;
