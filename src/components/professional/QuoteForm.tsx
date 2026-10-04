'use client';

import { useState, useTransition } from 'react';
import { createQuoteAction } from '@/app/professional/actions';
import { useRouter } from 'next/navigation';

interface LineItem {
  id: string;
  itemType: 'labour' | 'material' | 'fee';
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteFormProps {
  jobId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * QuoteForm: Submit a quote with line items
 * - Dynamic line items (add/remove rows)
 * - Auto-computed totals
 * - Server-side calculation verification
 * - Loading, error, and success states
 * - Full ARIA accessibility
 */
export function QuoteForm({ jobId, onSuccess, onCancel }: QuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [reason, setReason] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', itemType: 'labour', description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate totals
  const subtotal = lineItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );
  const platformFee = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + platformFee).toFixed(2));

  const isValid =
    reason.trim().length > 0 &&
    lineItems.length > 0 &&
    lineItems.every((item) => item.description.trim() && item.unitPrice > 0);

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        itemType: 'material',
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function updateLineItem(
    id: string,
    field: keyof LineItem,
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'quantity' || field === 'unitPrice'
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  }

  function removeLineItem(id: string) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValid) {
      setErrorMessage(
        'All fields required: quote reason, and at least one complete line item (description + price).'
      );
      return;
    }

    startTransition(async () => {
      const res = await createQuoteAction({
        jobId,
        reason,
        lineItems: lineItems.map((item) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      if (res.success) {
        setSuccessMessage('Quote submitted for customer approval.');
        router.refresh();
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to submit quote');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#D9DED8] bg-[#F7F4EC]">
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
          Quote Submission
        </div>
        <h3 className="text-base font-bold text-[#18211F]">
          Provide Your Estimate
        </h3>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 space-y-6">
        {/* Reason/Authorization Textarea */}
        <div>
          <label
            htmlFor="quote-reason"
            className="block text-sm font-bold text-[#18211F] mb-2"
          >
            Authorization Reason
            <span className="text-[#9B3535]">*</span>
          </label>
          <textarea
            id="quote-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this quote is needed and what authorization was given. (e.g., 'Customer approved full replacement after inspection found structural damage')"
            required
            aria-required="true"
            className="w-full px-4 py-3 border border-[#D9DED8] rounded-lg text-sm text-[#18211F] placeholder-[#7C8681] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent transition resize-none"
            rows={3}
          />
        </div>

        {/* Line Items Table */}
        <div>
          <label className="block text-sm font-bold text-[#18211F] mb-3">
            Line Items
            <span className="text-[#9B3535]">*</span>
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#D9DED8] bg-[#F7F4EC]">
                  <th
                    className="px-3 py-2 text-xs font-bold text-[#7C8681] text-left"
                    scope="col"
                  >
                    Type
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-bold text-[#7C8681] text-left"
                    scope="col"
                  >
                    Description
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-bold text-[#7C8681] text-right"
                    scope="col"
                  >
                    Qty
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-bold text-[#7C8681] text-right"
                    scope="col"
                  >
                    Unit Price
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-bold text-[#7C8681] text-right"
                    scope="col"
                  >
                    Total
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-[#7C8681]" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const rowTotal = Number(
                    (item.quantity * item.unitPrice).toFixed(2)
                  );
                  return (
                    <tr key={item.id} className="border-b border-[#D9DED8]">
                      <td className="px-3 py-3">
                        <select
                          value={item.itemType}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'itemType',
                              e.target.value as 'labour' | 'material' | 'fee'
                            )
                          }
                          className="px-2 py-1 border border-[#D9DED8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#176B5B]"
                        >
                          <option value="labour">Labour</option>
                          <option value="material">Material</option>
                          <option value="fee">Fee</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, 'description', e.target.value)
                          }
                          placeholder="e.g., Roof tile replacement"
                          required
                          className="w-full px-2 py-1 border border-[#D9DED8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#176B5B]"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, 'quantity', e.target.value)
                          }
                          className="w-16 px-2 py-1 border border-[#D9DED8] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#176B5B]"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unitPrice', e.target.value)
                          }
                          placeholder="0.00"
                          required
                          className="w-24 px-2 py-1 border border-[#D9DED8] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#176B5B]"
                        />
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#18211F]">
                        ₹{rowTotal.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="px-2 py-1 text-xs font-bold text-[#9B3535] hover:underline"
                            title={`Remove line item ${idx + 1}`}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addLineItem}
            className="mt-3 text-xs font-bold text-[#176B5B] hover:underline"
          >
            + Add Line Item
          </button>
        </div>

        {/* Summary */}
        <div className="bg-[#F7F4EC] rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#5A6661]">Subtotal:</span>
            <span className="font-bold text-[#18211F]">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5A6661]">Platform Fee (5%):</span>
            <span className="font-bold text-[#18211F]">₹{platformFee.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-[#D9DED8] flex justify-between text-base">
            <span className="font-bold text-[#18211F]">Total Quote:</span>
            <span className="font-bold text-[#176B5B] text-lg">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-[#F5E6E6] border border-[#DFC0C0] rounded-lg text-xs text-[#9B3535] font-medium"
          >
            {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            role="status"
            className="p-3 bg-[#E2EEE9] border border-[#176B5B] rounded-lg text-xs text-[#0D5144] font-medium"
          >
            ✓ {successMessage}
          </div>
        )}
      </div>

      {/* Footer: Actions */}
      <div className="px-5 md:px-6 py-4 md:py-5 border-t border-[#D9DED8] bg-[#F7F4EC] flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-bold text-[#5A6661] border border-[#D9DED8] rounded-lg hover:bg-[#FFFEFA] transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="px-6 py-2 text-sm font-bold text-white bg-[#176B5B] rounded-lg hover:bg-[#0D5144] transition disabled:opacity-50"
        >
          {isPending ? 'Submitting...' : 'Submit Quote'}
        </button>
      </div>
    </form>
  );
}
