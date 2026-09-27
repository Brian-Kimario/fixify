'use client';

import React, { useEffect, useRef, useState } from 'react';

export function WorkflowStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Describe what you see',
      eyebrow: 'PROBLEM INTAKE',
      desc: 'Use everyday words, upload a quick photo or video, or leave a note. You do not need to know the plumbing or electrical trade.',
      tag: 'Customer input',
    },
    {
      num: '02',
      title: 'Fixify structures the request',
      eyebrow: 'UNDERSTAND & TRIAGE',
      desc: 'The request is classified into the right service category with upfront pricing rules—fixed price, diagnostic inspection, or quote after inspection.',
      tag: 'Triage rules',
    },
    {
      num: '03',
      title: 'Matched with a verified technician',
      eyebrow: 'PROFESSIONAL DISPATCH',
      desc: 'An eligible, identity-vetted tradesperson in your neighborhood accepts the job with full problem context before arriving.',
      tag: 'Background checked',
    },
    {
      num: '04',
      title: 'Approve extra work before it begins',
      eyebrow: 'ON-SITE INSPECTION',
      desc: 'If additional parts or labor are discovered during inspection, the technician submits a clear line-item quote. Work proceeds only when you approve.',
      tag: 'Zero surprise bills',
    },
    {
      num: '05',
      title: 'Preserved in your property history',
      eyebrow: 'MAINTENANCE ARCHIVE',
      desc: 'Job details, completion photos, invoices, and a 30-day workmanship warranty attach permanently to your home’s address for future reference.',
      tag: 'The home remembers',
    },
  ];

  // Anime.js onScroll synchronization
  useEffect(() => {
    if (!sectionRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const stepElements = sectionRef.current.querySelectorAll('.workflow-step-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'));
            if (!isNaN(index)) {
              setActiveStep(index);
            }
          }
        });
      },
      {
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.2,
      }
    );

    stepElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 border-t border-line" id="how">
      <div className="wrap">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-4">
            HOW FIXIFY WORKS
          </p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight text-ink">
            From everyday words to an organized job.
          </h2>
          <p className="mt-4 text-base text-ink-3 leading-relaxed">
            Fixify coordinates the entire journey from your first observation to
            the permanent property maintenance record.
          </p>
        </div>

        {/* Sticky 2-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Sticky Dynamic Visual (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-[0_12px_36px_rgba(24,33,31,0.06)] overflow-hidden relative">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-4">
                  JOURNEY STAGE {steps[activeStep].num} / 05
                </span>
                <span className="font-mono text-[10px] font-bold text-teal">
                  {steps[activeStep].eyebrow}
                </span>
              </div>

              {/* Interactive State Representation */}
              <div className="space-y-4 min-h-[260px] flex flex-col justify-center">
                {activeStep === 0 && (
                  <div className="rounded-xl border border-line bg-porcelain p-4 space-y-3">
                    <span className="font-mono text-[10px] text-ink-4 uppercase">
                      Incoming observation
                    </span>
                    <p className="font-serif text-lg text-ink italic leading-snug">
                      &quot;Water is pooling under the kitchen sink when the dishwasher runs.&quot;
                    </p>
                    <div className="flex gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-paper px-2 py-1 text-[11px] border border-line text-ink-3">
                        📷 2 Photos added
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-teal-soft px-2 py-1 text-[11px] text-teal font-semibold">
                        Urgency: Moderate
                      </span>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="rounded-xl border border-line bg-porcelain p-4 space-y-3">
                    <span className="font-mono text-[10px] text-teal uppercase font-bold">
                      Platform Triage
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg bg-paper p-3 border border-line">
                        <small className="block font-mono text-[9px] text-ink-4">SERVICE</small>
                        <strong className="block text-sm text-ink mt-1">Plumbing Drainage</strong>
                      </div>
                      <div className="rounded-lg bg-paper p-3 border border-line">
                        <small className="block font-mono text-[9px] text-ink-4">PRICING MODE</small>
                        <strong className="block text-sm text-ink mt-1">Diagnostic Visit</strong>
                      </div>
                    </div>
                    <p className="text-xs text-ink-3">
                      Transparent inspection rate confirmed before booking confirmation.
                    </p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="rounded-xl border border-line bg-porcelain p-4 space-y-3">
                    <span className="font-mono text-[10px] text-teal uppercase font-bold">
                      Professional Assigned
                    </span>
                    <div className="flex items-center gap-3 rounded-lg bg-paper p-3 border border-line">
                      <div className="h-10 w-10 rounded-full bg-ink text-paper flex items-center justify-center font-bold text-xs">
                        DV
                      </div>
                      <div>
                        <strong className="block text-sm text-ink">Dario Venn</strong>
                        <span className="block text-xs text-ink-3">Licensed Plumber · 4.9★ (142 jobs)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-ink-3 px-1">
                      <span>Service radius: 4.2 km</span>
                      <span className="text-teal font-semibold">✓ ID & Skills Verified</span>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="rounded-xl border border-line bg-porcelain p-4 space-y-3">
                    <span className="font-mono text-[10px] text-clay uppercase font-bold">
                      Additional Work Approval
                    </span>
                    <div className="rounded-lg bg-paper p-3 border border-line space-y-2">
                      <div className="flex justify-between text-xs text-ink">
                        <span>P-Trap replacement & gasket</span>
                        <strong>₹420</strong>
                      </div>
                      <div className="flex justify-between text-xs text-ink">
                        <span>Additional repair labor (45 min)</span>
                        <strong>₹350</strong>
                      </div>
                      <div className="border-t border-line pt-2 flex justify-between text-xs font-bold text-ink">
                        <span>Total Additional Scope</span>
                        <span className="text-teal">₹770</span>
                      </div>
                    </div>
                    <span className="block text-center text-[11px] font-semibold text-teal bg-teal-soft py-1.5 rounded">
                      Customer Approved via Secure Portal
                    </span>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="rounded-xl border border-line bg-porcelain p-4 space-y-3">
                    <span className="font-mono text-[10px] text-success uppercase font-bold">
                      Property Record Saved
                    </span>
                    <div className="rounded-lg bg-paper p-3 border border-line space-y-1.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs text-ink">Meridian Court, Flat 3B</strong>
                        <span className="font-mono text-[9px] bg-success-soft text-success px-1.5 py-0.5 rounded font-bold">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-xs text-ink-3">
                        Kitchen drainage trap replaced. Verified leak-free test completed.
                      </p>
                      <div className="text-[10px] text-ink-4 border-t border-line pt-1 flex justify-between">
                        <span>30-Day Workmanship Warranty</span>
                        <span>Invoice FX-4790</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="mt-5 grid grid-cols-5 gap-1.5 border-t border-line/70 pt-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= activeStep ? 'bg-teal' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Scrollable Story Steps (7 cols) */}
          <div className="lg:col-span-7 space-y-12">
            {steps.map((step, idx) => (
              <div
                key={idx}
                data-step-index={idx}
                className={`workflow-step-card rounded-2xl border p-8 transition-all duration-300 ${
                  activeStep === idx
                    ? 'border-teal bg-paper shadow-[0_8px_30px_rgba(23,107,91,0.08)]'
                    : 'border-line/80 bg-paper/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal bg-teal-soft px-2.5 py-1 rounded">
                    STEP {step.num}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-ink-4">
                    {step.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
