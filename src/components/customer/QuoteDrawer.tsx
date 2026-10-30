'use client';

import { useRouter } from 'next/navigation';
import { QuoteApprovalPanel, type QuoteApprovalData } from './QuoteApprovalPanel';

/**
 * Opens the quote approval drawer for `/customer?quote=<id>`. Closing it drops the query
 * string; a decision refreshes the dashboard so the inbox and counts update.
 */
export function QuoteDrawer({ quote }: { quote: QuoteApprovalData }) {
  const router = useRouter();
  return (
    <QuoteApprovalPanel
      isOpen
      quote={quote}
      onClose={() => router.replace('/customer', { scroll: false })}
      onDecisionCompleted={() => router.refresh()}
    />
  );
}
