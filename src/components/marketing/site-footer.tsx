'use client';

import React from 'react';
import Link from 'next/link';
import { Symbol } from '@/components/brand/Symbol';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper py-16 text-ink-3" id="footer">
      <div className="wrap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link
              className="inline-flex items-center gap-2.5 font-bold tracking-tight text-ink hover:opacity-90 transition-opacity"
              href="/"
              aria-label="Fixify home"
            >
              <div className="text-teal">
                <Symbol size="md" />
              </div>
              <span className="text-xl tracking-tight text-ink font-display">Fixify</span>
            </Link>
            <p className="text-sm text-ink-3 max-w-sm leading-relaxed">
              Property maintenance, structured from your first observation to the permanent home maintenance record.
            </p>
            <div className="pt-2 text-xs font-mono text-ink-4">
              © {new Date().getFullYear()} Fixify Technologies Inc. All rights reserved.
            </div>
          </div>

          {/* Links Column 1: Product (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
              PRODUCT
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#services" className="hover:text-ink transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-ink transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#transparency" className="hover:text-ink transition-colors">
                  Pricing transparency
                </a>
              </li>
              <li>
                <a href="#property" className="hover:text-ink transition-colors">
                  Property record
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Professionals (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
              NETWORK
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/pro" className="hover:text-ink transition-colors">
                  Professional portal
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-ink transition-colors">
                  Join as technician
                </Link>
              </li>
              <li>
                <a href="#professionals" className="hover:text-ink transition-colors">
                  Payouts & terms
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Support (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
              STANDARDS
            </p>
            <ul className="space-y-2 text-xs">
              <li className="text-ink-3">
                <span className="font-semibold text-ink">30-day warranty</span> on eligible labor
              </li>
              <li className="text-ink-3">
                <span className="font-semibold text-ink">Zero surprise bills</span> customer sign-off required
              </li>
              <li className="text-ink-3">
                <span className="font-semibold text-ink">Strict verification</span> ID, license & skills
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 border-t border-line/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-4">
          <span>FIXIFY / PROPERTY SERVICES PLATFORM</span>
          <div className="flex gap-6">
            <span>LIGHT-FIRST ARCHITECTURE</span>
            <span>RESTFUL SERVICE WORKFLOW</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
