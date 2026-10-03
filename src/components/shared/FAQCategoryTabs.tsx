'use client';

import { useState } from 'react';
import { FAQ_CATEGORIES, getFAQByCategory, type FAQItem } from '@/lib/data/faq';
import { FAQAccordion } from './FAQAccordion';

type CategoryKey = keyof typeof FAQ_CATEGORIES;

interface FAQCategoryTabsProps {
  defaultCategory?: CategoryKey;
}

export function FAQCategoryTabs({ defaultCategory = 'getting-started' }: FAQCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(defaultCategory);
  const items = getFAQByCategory(activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-line pb-4 sm:gap-3">
        {(Object.entries(FAQ_CATEGORIES) as Array<[CategoryKey, (typeof FAQ_CATEGORIES)[CategoryKey]]>).map(
          ([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                activeCategory === key
                  ? 'bg-teal text-white'
                  : 'bg-porcelain text-ink-2 hover:bg-paper'
              }`}
              aria-pressed={activeCategory === key}
              aria-label={`View ${label}`}
            >
              <span className="text-base" aria-hidden="true">
                {icon}
              </span>
              <span className="hidden font-semibold sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          )
        )}
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl font-bold tracking-[-0.04em]">
          {FAQ_CATEGORIES[activeCategory].label}
        </h2>
        <FAQAccordion items={items} categoryLabel={FAQ_CATEGORIES[activeCategory].label} />
      </div>
    </div>
  );
}
