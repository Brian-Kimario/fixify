'use client';

import React from 'react';
import Link from 'next/link';
import { DirectionAwareTabs, TabItem } from '@/components/cult/DirectionAwareTabs';

export function PropertyRecordPreview() {
  const tabs: TabItem[] = [
    {
      id: 'plumbing',
      label: 'Plumbing',
      badge: '3 records',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-ink">Kitchen Sink P-Trap</strong>
                <span className="font-mono text-[9px] bg-success-soft text-success px-1.5 py-0.5 rounded font-bold">
                  WARRANTY ACTIVE
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1">Replaced corroded PVC trap and rubber seals. Tested under full pressure.</p>
              <span className="font-mono text-[10px] text-ink-4 mt-2 block">12 Mar 2026 · Dario Venn (Verified Plumber)</span>
            </div>
            <span className="font-mono text-xs font-semibold text-teal self-center">Invoice #4790</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-ink">Main Inflow Stopcock</strong>
                <span className="font-mono text-[9px] bg-paper-2 text-ink-3 px-1.5 py-0.5 rounded font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1">Installed modern brass quarter-turn lever valve for emergency shutoff.</p>
              <span className="font-mono text-[10px] text-ink-4 mt-2 block">08 Dec 2025 · Dario Venn</span>
            </div>
            <span className="font-mono text-xs font-semibold text-teal self-center">Invoice #3120</span>
          </div>
        </div>
      ),
    },
    {
      id: 'electrical',
      label: 'Electrical',
      badge: '2 records',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-ink">Distribution Board RCD Test</strong>
                <span className="font-mono text-[9px] bg-success-soft text-success px-1.5 py-0.5 rounded font-bold">
                  COMPLIANT
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1">Tripping fault isolated to outdoor lighting spur. Breaker recalibrated.</p>
              <span className="font-mono text-[10px] text-ink-4 mt-2 block">04 Feb 2026 · Emeric Sandoval (Master Electrician)</span>
            </div>
            <span className="font-mono text-xs font-semibold text-teal self-center">Invoice #4102</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-ink">Hallway 2-Gang USB Sockets</strong>
                <span className="font-mono text-[9px] bg-paper-2 text-ink-3 px-1.5 py-0.5 rounded font-bold">
                  INSTALLED
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1">Replaced loose legacy sockets with surge-protected USB-C outlets.</p>
              <span className="font-mono text-[10px] text-ink-4 mt-2 block">19 Nov 2025 · Emeric Sandoval</span>
            </div>
            <span className="font-mono text-xs font-semibold text-teal self-center">Invoice #2980</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cooling',
      label: 'AC & Cooling',
      badge: '1 record',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-ink">Master Bedroom Split AC</strong>
                <span className="font-mono text-[9px] bg-success-soft text-success px-1.5 py-0.5 rounded font-bold">
                  ANNUAL PASS
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1">Deep coil foam wash, drain pan clear, and air volume sensor check.</p>
              <span className="font-mono text-[10px] text-ink-4 mt-2 block">18 Jan 2026 · Lea Fontaine (HVAC Specialist)</span>
            </div>
            <span className="font-mono text-xs font-semibold text-teal self-center">Invoice #3890</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-24 border-t border-line bg-porcelain" id="property">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-4">
              PERMANENT PROPERTY HISTORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Your home should remember the work.
            </h2>
            <p className="text-base text-ink-3 leading-relaxed">
              When tradespeople change or properties are sold or leased, maintenance context is usually lost in old text threads.
              Fixify attaches every invoice, replaced part, and active warranty directly to your property passport.
            </p>

            <div className="pt-2">
              <Link
                href="/customer/properties"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-deep transition-colors"
              >
                <span>Explore property records in dashboard</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive DirectionAwareTabs Passport */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-[0_16px_40px_rgba(24,33,31,0.06)]">
              {/* Passport Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-6">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-4">
                    PROPERTY PASSPORT
                  </span>
                  <h3 className="text-lg font-bold text-ink mt-0.5">
                    Meridian Court, Flat 3B
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold bg-success-soft text-success px-2.5 py-1 rounded-full">
                    ● 14 TOTAL JOBS PRESERVED
                  </span>
                </div>
              </div>

              {/* DirectionAwareTabs Switcher */}
              <DirectionAwareTabs tabs={tabs} defaultTab="plumbing" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
