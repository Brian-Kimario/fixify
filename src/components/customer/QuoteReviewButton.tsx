'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteApprovalPanel, type QuoteApprovalData } from './QuoteApprovalPanel';

/** Opens the quote approval drawer from the booking page; a decision refreshes the case file. */
export function QuoteReviewButton({ quote }: { quote: QuoteApprovalData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-teal px-4 text-sm font-semibold text-paper transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 sm:w-auto"
      >
        Review and decide
      </button>
      <QuoteApprovalPanel
        isOpen={open}
        quote={quote}
        onClose={() => setOpen(false)}
        onDecisionCompleted={() => router.refresh()}
      />
    </>
  );
}
