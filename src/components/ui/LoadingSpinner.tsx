'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Size of spinner: sm (24px), md (32px), lg (48px)
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color tone: primary (teal), secondary (ink-3), danger, success
   * @default 'primary'
   */
  tone?: 'primary' | 'secondary' | 'danger' | 'success';
  /**
   * Optional label displayed below spinner
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * For accessibility: aria-label
   */
  ariaLabel?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 48,
};

const COLOR_MAP = {
  primary: 'stroke-teal',
  secondary: 'stroke-ink-3',
  danger: 'stroke-danger',
  success: 'stroke-success',
};

/**
 * LoadingSpinner - Standardized animated loader
 * 
 * Uses consistent animation timing (300ms, ease-out) matching design system.
 * Respects prefers-reduced-motion for accessibility.
 * 
 * @example
 * <LoadingSpinner size="md" tone="primary" label="Loading..." />
 */
export function LoadingSpinner({
  size = 'md',
  tone = 'primary',
  label,
  className = '',
  ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const dimension = SIZE_MAP[size];
  const colorClass = COLOR_MAP[tone];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {/* Spinner circle with continuous rotation */}
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${colorClass} motion-safe:animate-spin`}
        style={{
          // CSS animation: 1000ms for full rotation (standardized per brand)
          animation: 'var(--animation-spinner)',
        }}
      >
        {/* Outer circle (background) */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.2"
        />
        
        {/* Animated arc */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="62.83"
          strokeDashoffset="15.71"
          strokeLinecap="round"
          fill="none"
          className="motion-safe:animate-spin"
        />
      </svg>

      {/* Optional label */}
      {label && (
        <p className="text-sm font-medium text-ink-2 motion-safe:animate-pulse">
          {label}
        </p>
      )}

      {/* For screen readers: hidden status text */}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * LoadingBar - Horizontal progress indicator
 * Useful for page-level loading or multi-step processes
 */
interface LoadingBarProps {
  /**
   * Progress percentage (0-100)
   */
  progress?: number;
  /**
   * Show animated indeterminate loading (ignores progress)
   */
  indeterminate?: boolean;
  className?: string;
}

export function LoadingBar({
  progress = 0,
  indeterminate = false,
  className = '',
}: LoadingBarProps) {
  return (
    <div
      className={`w-full h-1 bg-line rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? 0 : progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full bg-teal rounded-full transition-all duration-300 ${
          indeterminate ? 'motion-safe:animate-pulse' : ''
        }`}
        style={{
          width: indeterminate ? '100%' : `${Math.min(100, Math.max(0, progress))}%`,
          opacity: indeterminate ? 0.6 : 1,
        }}
      />
    </div>
  );
}

/**
 * SkeletonCard - Loading skeleton for card-like content
 * Use for lists, grids, or individual content areas
 */
interface SkeletonCardProps {
  /**
   * Show image placeholder
   */
  hasImage?: boolean;
  /**
   * Number of text lines
   */
  lineCount?: number;
  className?: string;
}

export function SkeletonCard({
  hasImage = true,
  lineCount = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-paper p-4 space-y-3 ${className}`}
      aria-busy="true"
    >
      {/* Image placeholder */}
      {hasImage && (
        <div className="w-full h-40 rounded-lg bg-porcelain animate-pulse" />
      )}

      {/* Text line placeholders */}
      <div className="space-y-2">
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            className={`h-3 bg-porcelain rounded animate-pulse ${
              i === lineCount - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
