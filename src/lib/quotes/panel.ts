import type { QuoteApprovalData } from '@/components/customer/QuoteApprovalPanel';
import type { QuoteForReview } from '@/lib/services/shell';

/** Maps a quote loaded for review to the approval drawer's props. */

type LineItemType = QuoteApprovalData['lineItems'][number]['type'];

function isLineItemType(value: string): value is LineItemType {
  return value === 'labour' || value === 'material' || value === 'fee';
}

export function toPanelQuote(q: QuoteForReview): QuoteApprovalData {
  const lineItems = q.items.map((i) => ({
    id: i.id,
    type: isLineItemType(i.itemType) ? i.itemType : 'material',
    description: i.description,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    total: i.lineTotal,
  }));
  return {
    id: q.id,
    jobId: q.jobId,
    bookingId: q.bookingId ?? undefined,
    referenceNumber: q.reference,
    serviceTitle: q.serviceName,
    propertyName: q.propertyName,
    proName: q.proName,
    reason: q.reason,
    lineItems,
    subtotal: q.subtotal,
    partsTotal: lineItems.filter((i) => i.type === 'material').reduce((sum, i) => sum + i.total, 0),
    discount: q.discount,
    platformFee: q.taxesOrFees,
    totalAmount: q.total,
  };
}
