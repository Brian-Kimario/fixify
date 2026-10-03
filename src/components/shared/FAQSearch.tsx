'use client';

import { useEffect, useState } from 'react';
import { searchFAQ, type FAQItem } from '@/lib/data/faq';
import { FAQAccordion } from './FAQAccordion';

interface FAQSearchProps {
  placeholder?: string;
  showResultCount?: boolean;
}

export function FAQSearch({ placeholder = 'Search FAQs...', showResultCount = true }: FAQSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FAQItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setIsSearching(true);
        const searchResults = searchFAQ(query);
        setResults(searchResults);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-base placeholder-ink-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          aria-label="Search FAQs"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-ink-4">
          🔍
        </span>
      </div>

      {query.trim() && (
        <div className="space-y-4">
          {showResultCount && (
            <div className="text-sm text-ink-3">
              {isSearching ? (
                'Searching...'
              ) : results.length === 1 ? (
                `Found 1 result`
              ) : results.length > 1 ? (
                `Found ${results.length} results`
              ) : (
                'No results found'
              )}
            </div>
          )}
          {results.length > 0 && <FAQAccordion items={results} />}
          {!isSearching && results.length === 0 && (
            <div className="rounded-lg border border-line bg-porcelain p-6 text-center">
              <p className="text-ink-3">
                No FAQs match "<strong>{query}</strong>". Try different keywords or{' '}
                <a href="#contact-support" className="font-semibold text-teal hover:underline">
                  contact support
                </a>
                .
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
