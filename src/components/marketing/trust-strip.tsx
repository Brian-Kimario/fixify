'use client';

import React from 'react';
import { AnimatedNumber } from '@/components/cult/AnimatedNumber';

export function TrustStrip() {
  const trustSignals = [
    {
      number: 100,
      suffix: '%',
      title: 'Vetted professionals',
      description: 'Identity, trade skills and background verified before live work.',
    },
    {
      number: 30,
      suffix: ' days',
      title: 'Workmanship warranty',
      description: 'Standard guarantee on eligible repair labor across all trades.',
    },
    {
      number: 3,
      suffix: ' pricing modes',
      title: 'Upfront transparency',
      description: 'Fixed price, inspection fee, or quote approval before work.',
    },
    {
      number: 1,
      suffix: ' property record',
      title: 'The home remembers',
      description: 'Every invoice, part and warranty stays attached to the address.',
    },
  ];

  return (
    <section className="border-y border-line bg-paper-2/60 py-10">
      <div className="wrap">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
          {trustSignals.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                idx === 0 ? 'lg:pr-8' : idx === 3 ? 'lg:pl-8' : 'lg:px-8'
              }`}
            >
              <div className="text-2xl lg:text-3xl font-bold tracking-tight text-ink font-display">
                <AnimatedNumber value={item.number} suffix={item.suffix} />
              </div>
              <h4 className="mt-2 text-sm font-semibold tracking-tight text-ink">
                {item.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
