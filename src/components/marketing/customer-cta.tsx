'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { createTimeline, stagger } from 'animejs';

export function CustomerCTA() {
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ctaRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const path = ctaRef.current.querySelector('#closing-loop-path') as SVGPathElement;
    if (path && path.getTotalLength) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const tl = createTimeline({ playbackEase: 'out(3)' });

          tl.add('#closing-loop-path', {
            strokeDashoffset: 0,
            duration: 800,
            ease: 'out(3)',
          });

          tl.add('.cta-loop-node', {
            opacity: [0, 1],
            scale: [0.7, 1],
            delay: stagger(120),
            duration: 400,
            ease: 'out(3)',
          }, '-=300');

          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ctaRef} className="py-24 border-t border-line bg-porcelain">
      <div className="wrap">
        <div className="rounded-3xl border border-line bg-paper p-8 sm:p-14 shadow-[0_20px_50px_rgba(24,33,31,0.06)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column (7 cols): Strong problem-first invitation */}
            <div className="lg:col-span-7 space-y-4">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-4">
                READY WHEN YOU ARE
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
                Something in your home needs attention?
              </h2>
              <p className="text-base text-ink-3 max-w-lg leading-relaxed">
                Start with a few words or a photo. We will guide you to the right diagnostic visit, vetted technician, and permanent maintenance record.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/customer"
                  className="group inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3.5 text-sm font-semibold text-paper shadow-[0_8px_24px_rgba(23,107,91,0.22)] hover:bg-teal-deep hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <span>Describe a problem</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </Link>

                <a
                  href="#services"
                  className="text-xs font-semibold text-ink-3 hover:text-ink transition-colors px-2 py-1"
                >
                  Or browse 8 trade categories
                </a>
              </div>
            </div>

            {/* Right Column (5 cols): Closing the loop SVG diagram */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="rounded-xl border border-line bg-porcelain/80 p-5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-ink-4 block mb-3">
                  THE COMPLETE FIXIFY LOOP
                </span>

                <svg viewBox="0 0 320 80" fill="none" className="w-full h-auto">
                  {/* Connecting path */}
                  <path
                    id="closing-loop-path"
                    d="M 30 40 L 150 40 L 270 40"
                    stroke="var(--fx-teal, #176B5B)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* 1. Problem Node */}
                  <g className="cta-loop-node" opacity="0">
                    <circle cx="30" cy="40" r="14" fill="var(--fx-clay-soft, #F3E1DA)" />
                    <circle cx="30" cy="40" r="5" fill="var(--fx-clay, #A9523D)" />
                    <text x="30" y="68" textAnchor="middle" fill="var(--fx-ink-3, #5A6661)" fontSize="9" fontFamily="var(--mono)" fontWeight="600">
                      Problem
                    </text>
                  </g>

                  {/* 2. Professional Node */}
                  <g className="cta-loop-node" opacity="0">
                    <circle cx="150" cy="40" r="14" fill="var(--fx-teal-soft, #E2EEE9)" />
                    <circle cx="150" cy="40" r="5" fill="var(--fx-teal, #176B5B)" />
                    <text x="150" y="68" textAnchor="middle" fill="var(--fx-teal, #176B5B)" fontSize="9" fontFamily="var(--mono)" fontWeight="600">
                      Professional
                    </text>
                  </g>

                  {/* 3. Record Node */}
                  <g className="cta-loop-node" opacity="0">
                    <circle cx="270" cy="40" r="14" fill="var(--fx-success-soft, #E3F0E8)" />
                    <path d="M 264 40 L 268 44 L 276 35" fill="none" stroke="var(--fx-success, #2F7D5B)" strokeWidth="2.2" strokeLinecap="round" />
                    <text x="270" y="68" textAnchor="middle" fill="var(--fx-success, #2F7D5B)" fontSize="9" fontFamily="var(--mono)" fontWeight="600">
                      Saved Record
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
