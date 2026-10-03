'use client';

import { useState } from 'react';
import type { FAQItem } from '@/lib/data/faq';

interface FAQAccordionProps {
  items: FAQItem[];
  categoryLabel?: string;
}

export function FAQAccordion({ items, categoryLabel }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-ink-3">No FAQs found in this category.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="w-full px-6 py-5 text-left transition hover:bg-porcelain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
              aria-expanded={openId === item.id}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="max-w-2xl font-semibold text-ink">{item.question}</h3>
                <span
                  className="mt-1 shrink-0 text-lg transition-transform duration-200"
                  aria-hidden="true"
                  style={{
                    transform: openId === item.id ? 'rotate(180deg)' : undefined,
                  }}
                >
                  ↓
                </span>
              </div>
            </button>
            {openId === item.id && (
              <div className="bg-porcelain px-6 py-5">
                <p className="text-base leading-7 text-ink-2">{item.answer}</p>
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-full bg-teal-soft px-2 py-1 text-xs font-medium text-teal"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
