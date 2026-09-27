'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { TextAnimate } from '@/components/cult/TextAnimate';
import { SvgShapesAnimated } from '@/components/cult/SvgShapesAnimated';

export function Hero() {
  const visualRef = useRef<HTMLDivElement>(null);
  const [pointerStyle, setPointerStyle] = useState<React.CSSProperties>({});
  const isTouchDevice = useRef(false);

  // Subtle desktop pointer parallax: ±8px X, ±6px Y, ±1.5deg rotation
  useEffect(() => {
    isTouchDevice.current =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isTouchDevice.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!visualRef.current) return;
      const rect = visualRef.current.getBoundingClientRect();
      const visualCenterX = rect.left + rect.width / 2;
      const visualCenterY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - visualCenterX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - visualCenterY) / (window.innerHeight / 2);

      const moveX = Math.max(-8, Math.min(8, deltaX * 8));
      const moveY = Math.max(-6, Math.min(6, deltaY * 6));
      const rotate = Math.max(-1.5, Math.min(1.5, deltaX * 1.5));

      setPointerStyle({
        transform: `translate3d(${moveX}px, ${moveY}px, 0) rotate(${rotate}deg)`,
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      });
    };

    const handleMouseLeave = () => {
      setPointerStyle({
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      {/* Background Architectural Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage:
            'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="wrap relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Editorial Headline & Value (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-ink-3 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
                PROPERTY MAINTENANCE / ONE CLEAR JOURNEY
              </span>
            </div>

            {/* Editorial Headline with TextAnimate line reveal */}
            <TextAnimate
              lines={['Your problem.', 'Properly fixed.']}
              highlightLast
              className="text-4xl sm:text-6xl lg:text-[76px] font-bold tracking-tight text-ink leading-[1.04]"
              delay={0.1}
            />

            <p className="max-w-xl text-base sm:text-lg text-ink-3 leading-relaxed">
              Tell Fixify what is happening. We help turn it into the right
              service, a clear booking and a properly recorded job.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/customer"
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3.5 text-sm font-semibold text-paper shadow-[0_8px_24px_rgba(23,107,91,0.22)] hover:bg-teal-deep hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-200"
              >
                <span>Describe a problem</span>
                <span
                  className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>

              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-paper/80 px-5 py-3.5 text-sm font-semibold text-ink shadow-xs hover:border-line-strong hover:bg-paper transition-all duration-200"
              >
                Browse services
              </a>
            </div>

            {/* Reassurance Note */}
            <div className="flex items-center gap-3 pt-2 text-xs text-ink-4">
              <span className="flex h-2 w-2 rounded-full bg-teal shadow-[0_0_0_4px_var(--fx-teal-soft,#E2EEE9)]" />
              <span>
                You do not need to know the trade. Photos or video can help, but
                you can start with words alone.
              </span>
            </div>
          </div>

          {/* Right Column: Custom Architectural SVG Journey (5 cols on desktop) */}
          <div className="lg:col-span-5" ref={visualRef} style={pointerStyle}>
            <div className="relative rounded-2xl border border-line bg-paper p-4 sm:p-6 shadow-[0_20px_50px_rgba(24,33,31,0.08)]">
              {/* Shell Header */}
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
                  SERVICE LIFECYCLE
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-teal">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal animate-ping" />
                  AUTHENTICATED WORKFLOW
                </span>
              </div>

              {/* Animated SVG Path Visualization */}
              <SvgShapesAnimated />

              {/* Shell Footer context note */}
              <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-ink-4">
                <span>Problem identified → Diagnostic visit → Recorded to home</span>
                <span className="font-mono text-[10px] font-semibold text-teal">
                  30-DAY WARRANTY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
