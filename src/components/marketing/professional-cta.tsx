'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { createTimeline, stagger } from 'animejs';

export function ProfessionalCTA() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          createTimeline({ playbackEase: 'out(3)' })
            .add('.pro-status-step', {
              opacity: [0, 1],
              translateY: [8, 0],
              delay: stagger(100),
              duration: 450,
              ease: 'out(3)',
            })
            .add('.pro-status-connector', {
              scaleX: [0, 1],
              duration: 500,
              ease: 'out(3)',
            }, '-=200');

          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    { label: 'Verified Brief', desc: 'Photos & symptoms' },
    { label: 'Accepted', desc: 'Controlled radius' },
    { label: 'On-site Quote', desc: 'Customer sign-off' },
    { label: 'Completed', desc: 'Proof submitted' },
    { label: 'Weekly Payout', desc: 'Reliable settlement' },
  ];

  return (
    <section
      ref={containerRef}
      className="py-24 bg-porcelain text-ink border-t border-line"
      id="professionals"
    >
      <div className="wrap">
        <div className="rounded-3xl border border-line bg-paper p-8 sm:p-14 shadow-[0_16px_40px_rgba(24,33,31,0.05)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-teal bg-teal-soft px-2.5 py-1 rounded inline-block">
                TRADES & SPECIALISTS
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
                You do the skilled work. Fixify handles the intake & invoicing.
              </h2>
              <p className="text-base text-ink-3 leading-relaxed max-w-xl">
                Receive verified job requests in your serviceable neighborhood with customer photos and diagnostic context.
                Submit change quotes on site, record completion proof, and receive weekly settlements without chasing unpaid bills.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link
                  href="/pro"
                  className="inline-flex items-center justify-center rounded-xl bg-teal px-6 py-3.5 text-sm font-bold text-paper hover:bg-teal-deep hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  Professional workspace
                </Link>
                <Link
                  href="/auth/login?role=professional"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-paper px-5 py-3.5 text-sm font-semibold text-ink hover:bg-porcelain hover:border-line-strong transition-colors"
                >
                  Professional sign in
                </Link>
              </div>
            </div>

            {/* Right Column: Precise Operational Route Step Sequence */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-line bg-porcelain p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-line">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
                    OPERATIONAL LIFECYCLE
                  </span>
                  <span className="font-mono text-[10px] text-teal font-bold bg-teal-soft px-2 py-0.5 rounded">
                    DIRECT SETTLEMENTS
                  </span>
                </div>

                {/* Steps progression */}
                <div className="mt-6 space-y-4">
                  {steps.map((s, idx) => (
                    <div key={idx} className="pro-status-step flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 rounded-full bg-teal text-paper text-xs font-mono font-bold items-center justify-center flex-shrink-0">
                          0{idx + 1}
                        </span>
                        {idx < steps.length - 1 && (
                          <div className="pro-status-connector w-[1.5px] h-8 bg-line origin-top" />
                        )}
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-ink">
                          {s.label}
                        </strong>
                        <span className="text-xs text-ink-3">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
