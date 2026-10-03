'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

/**
 * Skeleton - Animated loading placeholder
 * Shows shimmer effect while content loads
 */
export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'bg-porcelain animate-pulse';

  const variantClasses = {
    text: 'h-4 rounded',
    rect: 'h-12 rounded-lg',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} aria-busy="true" />
  );
}

/**
 * SkeletonGroup - Multiple skeleton loaders for complex layouts
 */
interface SkeletonGroupProps {
  count: number;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export function SkeletonGroup({ count, className = '', gap = 'md' }: SkeletonGroupProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`space-y-3 ${gapClasses[gap]}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
