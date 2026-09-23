'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export function Hero() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-mint/5 via-dark to-dark pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-6xl text-ink leading-tight">
                Your problem.
                <span className="block text-mint">Properly fixed.</span>
              </h1>
              <p className="text-line text-lg sm:text-xl max-w-lg leading-relaxed">
                Tell Fixify what is wrong, show us what you can, and we will help turn it into a clear service job with a verified professional.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/customer" className="flex-1 sm:flex-none">
                <Button variant="primary" size="lg" className="w-full">
                  Describe a problem →
                </Button>
              </Link>
              <Link href="/services" className="flex-1 sm:flex-none">
                <Button variant="secondary" size="lg" className="w-full">
                  Browse services
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 border-t border-line/30 space-y-3">
              <p className="text-line text-sm font-medium">Trusted by property owners</p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-mint to-mint/50 border-2 border-dark flex items-center justify-center text-dark text-xs font-bold"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="text-ink font-medium">1,200+ service jobs completed</p>
                  <p className="text-line">Every property, better documented</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Demo */}
          <div className="relative h-96 lg:h-auto hidden lg:block">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mint/10 to-mint/5 border border-mint/20 overflow-hidden">
              {/* Problem intake demo */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-line text-xs font-medium uppercase tracking-wider">
                    What needs fixing?
                  </label>
                  <div className="bg-dark border border-line rounded-lg p-4 text-ink placeholder-line/50">
                    "Water is leaking under my sink."
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-line text-xs font-medium uppercase tracking-wider">
                    Help us understand
                  </label>
                  <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-lg bg-line/10 border border-line flex items-center justify-center text-line">
                      📷
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-line/10 border border-line flex items-center justify-center text-line">
                      🎬
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-line/10 border border-line flex items-center justify-center text-line">
                      ✏️
                    </div>
                  </div>
                </div>

                <div className="border-t border-line/30 pt-4 space-y-3">
                  <p className="text-line text-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-mint mr-2" />
                    Likely service: <strong>Plumbing</strong>
                  </p>
                  <p className="text-line text-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-mint mr-2" />
                    We found <strong>3 professionals</strong> available
                  </p>
                  <p className="text-line text-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-mint mr-2" />
                    Average response: <strong>within 2 hours</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
