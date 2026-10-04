'use client';

/**
 * LoadingState: Skeleton loader for dashboard sections
 * Respects prefers-reduced-motion
 */
export function LoadingState() {
  return (
    <div className="space-y-3">
      {/* Simulate 3 skeleton cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 bg-[#FFFEFA] border border-[#D9DED8] rounded-lg animate-pulse"
          style={{
            animation:
              'prefers-reduced-motion: no-preference ? pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite : none',
          }}
        >
          <div className="h-4 bg-[#E2EEE9] rounded w-2/3 mb-2" />
          <div className="h-3 bg-[#E2EEE9] rounded w-1/2" />
        </div>
      ))}

      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        }
      `}</style>
    </div>
  );
}
