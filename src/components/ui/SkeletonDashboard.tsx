'use client';

import React from 'react';

interface SkeletonDashboardProps {
  /**
   * Variant for role-specific layout
   */
  variant: 'customer' | 'professional' | 'admin';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SkeletonDashboard - Role-specific dashboard loading skeleton
 *
 * Renders approximate geometry for dashboard cards to prevent CLS.
 * Breakpoints match design:
 * - Mobile (<640px): 1 column
 * - Tablet (640-1023px): role-specific cols (5 for customer, 2 for professional, 2 for admin)
 * - Desktop (≥1024px): role-specific cols (7 for customer, 3 for professional, 4 for admin)
 *
 * Card heights approximate final layout dimensions.
 *
 * @example
 * <SkeletonDashboard variant="customer" />
 */
export function SkeletonDashboard({
  variant,
  className = '',
}: SkeletonDashboardProps) {
  // Render grid of skeleton cards based on variant
  const renderSkeletons = () => {
    switch (variant) {
      case 'customer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {/* Greeting card - 60px */}
            <div className="md:col-span-5 lg:col-span-7 h-[60px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Active job panel - 280px */}
            <div className="md:col-span-5 lg:col-span-3 h-[280px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Quote approval panel - 320px */}
            <div className="md:col-span-5 lg:col-span-4 h-[320px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Properties list - 2 rows × 56px */}
            <div className="md:col-span-5 lg:col-span-7">
              <div className="space-y-2">
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Availability toggle - 80px */}
            <div className="md:col-span-2 lg:col-span-3 h-[80px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Requests to review - 2 cards × 240px */}
            <div className="md:col-span-1 lg:col-span-1 h-[240px] rounded-lg bg-porcelain animate-pulse" />
            <div className="md:col-span-1 lg:col-span-1 h-[240px] rounded-lg bg-porcelain animate-pulse" />
            <div className="md:col-span-1 lg:col-span-1 h-[240px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Active route jobs - 3 cards × 160px */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-[160px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[160px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[160px] rounded-lg bg-porcelain animate-pulse" />
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metrics - 4 cards × 100px */}
            <div className="h-[100px] rounded-lg bg-porcelain animate-pulse" />
            <div className="h-[100px] rounded-lg bg-porcelain animate-pulse" />
            <div className="h-[100px] rounded-lg bg-porcelain animate-pulse" />
            <div className="h-[100px] rounded-lg bg-porcelain animate-pulse" />
            
            {/* Attention queue - 2 rows × 56px */}
            <div className="md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
              </div>
            </div>
            
            {/* Verification queue - 3 rows × 56px */}
            <div className="md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
                <div className="h-[56px] rounded-lg bg-porcelain animate-pulse" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full ${className}`}
      role="status"
      aria-label={`Loading ${variant} dashboard`}
      aria-busy="true"
    >
      {renderSkeletons()}
    </div>
  );
}
