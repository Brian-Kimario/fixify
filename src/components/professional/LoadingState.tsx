'use client';

/**
 * LoadingState — Professional dashboard skeleton loader
 * Accurate to the shape/size of professional job listings.
 * Respects prefers-reduced-motion.
 */
export function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading your jobs…">
      {/* Header skeleton */}
      <div className="space-y-2 animate-pulse motion-reduce:animate-none">
        <div className="h-8 bg-[#18211F]/10 rounded w-48" />
        <div className="h-4 bg-[#18211F]/10 rounded w-72" />
      </div>

      {/* Job cards skeleton — simulate 3 cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 bg-[#FFFEFA] border border-[#D9DED8] rounded-lg animate-pulse motion-reduce:animate-none space-y-3"
        >
          {/* Job header */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#E2EEE9] rounded w-40" />
              <div className="h-4 bg-[#E2EEE9] rounded w-56" />
            </div>
            <div className="h-6 bg-[#E2EEE9] rounded w-20" />
          </div>

          {/* Job meta */}
          <div className="flex gap-4 text-sm">
            <div className="h-4 bg-[#E2EEE9] rounded w-24" />
            <div className="h-4 bg-[#E2EEE9] rounded w-32" />
          </div>

          {/* Job action button */}
          <div className="h-10 bg-[#E2EEE9] rounded w-32" />
        </div>
      ))}

      <span className="sr-only">Loading your jobs…</span>
    </div>
  );
}
