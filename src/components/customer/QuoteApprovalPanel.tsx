'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { animate } from 'animejs';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  HelpCircle,
  Wrench,
  Clock,
  ArrowRight
} from 'lucide-react';
import { respondToQuoteAction } from '@/app/customer/actions';
import { SuccessState } from '@/components/ui/SuccessState';
import { formatCurrency } from '@/lib/currency';

export interface QuoteLineItem {
  id: string;
  type: 'labour' | 'material' | 'fee';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteApprovalData {
  id: string;
  jobId: string;
  referenceNumber: string;
  serviceTitle: string;
  propertyName: string;
  propertyAddress?: string;
  proName: string;
  reason: string;
  findings?: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  partsTotal: number;
  platformFee: number;
  totalAmount: number;
  expiresInHours?: number;
}

interface QuoteApprovalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteApprovalData | null;
  onDecisionCompleted?: (decision: 'approved' | 'declined') => void;
}

export function QuoteApprovalPanel({
  isOpen,
  onClose,
  quote,
  onDecisionCompleted,
}: QuoteApprovalPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [successData, setSuccessData] = useState<{ jobId?: string; bookingId?: string } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Drawer animation with Anime.js (350ms)
  useEffect(() => {
    if (isOpen) {
      if (backdropRef.current) {
        animate(backdropRef.current, {
          opacity: [0, 1],
          duration: 300,
          ease: 'outQuad',
        });
      }
      if (panelRef.current) {
        animate(panelRef.current, {
          translateX: ['100%', '0%'],
          duration: 350,
          ease: 'outCubic',
        });
      }
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen && !panelRef.current) return null;

  // Show success state overlay when quote is approved
  if (showSuccessState && successData?.jobId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#18211F]/40 backdrop-blur-sm" />
        <div className="relative">
          <SuccessState
            title="Quote approved"
            description="Work will begin soon. The professional will contact you with next steps."
            action={{
              label: 'View booking',
              onClick: () => router.push(`/customer/bookings/${successData.jobId}`),
            }}
            secondaryAction={{
              label: 'Back to dashboard',
              onClick: () => router.push('/customer'),
            }}
          />
        </div>
      </div>
    );
  }

  const sampleQuote: QuoteApprovalData = quote || {
    id: 'sample-quote-1',
    jobId: 'job-fx-4821',
    referenceNumber: 'FX-4821',
    serviceTitle: 'Kitchen Vanity Leak Repair',
    propertyName: 'Oakwood Residence',
    propertyAddress: '1428 Elm Creek Road, Apt 4B',
    proName: 'Dario Venn (Master Plumber)',
    reason: 'During vanity shutoff disassembly, discovered the supply collar fitting was severely corroded and fused. Requires cutting out the oxidized fitting and mounting a new compression quarter-turn valve to ensure water seal integrity.',
    findings: 'Micro-leakage behind drywall had started soft wood deterioration. Replacing now prevents drywall replacement later.',
    lineItems: [
      { id: '1', type: 'labour', description: 'Fitting extraction & precision copper pipe prep', quantity: 1, unitPrice: 65.0, total: 65.0 },
      { id: '2', type: 'material', description: 'Brasscraft 1/2" Compression Quarter-Turn Valve', quantity: 1, unitPrice: 28.5, total: 28.5 },
      { id: '3', type: 'material', description: 'Stainless braided 3/8" x 20" lavatory supply tube', quantity: 1, unitPrice: 10.0, total: 10.0 },
      { id: '4', type: 'fee', description: 'Fixify 12-Month Workmanship Warranty Guarantee', quantity: 1, unitPrice: 4.5, total: 4.5 },
    ],
    subtotal: 65.0,
    partsTotal: 38.5,
    platformFee: 4.5,
    totalAmount: 108.0,
    expiresInHours: 24,
  };

  const handleDecision = (decision: 'approved' | 'declined') => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const res = await respondToQuoteAction({
          quoteId: sampleQuote.id,
          jobId: sampleQuote.jobId,
          decision,
          reason: decision === 'declined' ? declineReason : undefined,
        });

        if (res.success) {
          if (decision === 'approved') {
            // Show success state for quote approval
            setSuccessData({ jobId: sampleQuote.jobId, bookingId: sampleQuote.jobId });
            setShowSuccessState(true);
            setStatusMessage(null);
          } else {
            // For declined, show inline message and close
            setStatusMessage({
              type: 'success',
              text: 'Quote declined. Technician will pause extra work.',
            });
            if (onDecisionCompleted) {
              onDecisionCompleted(decision);
            }
            setTimeout(() => {
              onClose();
            }, 1200);
          }
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to update quote decision.' });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setStatusMessage({ type: 'error', text: errorMsg });
      }
    });
  };

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-approval-title"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={() => !isPending && onClose()}
        className="fixed inset-0 bg-[#18211F]/50 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={panelRef}
          className="w-screen max-w-lg bg-[#FFFEFA] border-l border-[#D9DED8] shadow-2xl flex flex-col h-full overflow-y-auto"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#D9DED8] bg-[#F7F4EC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9B6A1E] px-2.5 py-1 rounded-full bg-[#F5EBD7] border border-[#DDCCAB]">
                  EXTRA WORK AUTHORIZATION
                </span>
                <span className="text-xs font-mono font-bold text-[#18211F]">{sampleQuote.referenceNumber}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="w-9 h-9 rounded-full border border-[#D9DED8] bg-white flex items-center justify-center text-[#5A6661] hover:text-[#18211F] hover:bg-[#F1EEE5] transition-colors"
                aria-label="Close quote drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 id="quote-approval-title" className="text-xl font-bold text-[#18211F] mt-3">
              Quote for Additional Work
            </h3>
            <p className="text-xs text-[#5A6661] mt-1">
              Submitted by <strong>{sampleQuote.proName}</strong> for {sampleQuote.propertyName}
            </p>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Status alerts */}
            {statusMessage && (
              <div 
                className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                  statusMessage.type === 'success'
                    ? 'bg-[#E2EEE9] text-[#176B5B] border border-[#BCD4CC]'
                    : 'bg-[#FBE8E8] text-[#DC2626] border border-[#F5B5B5]'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Diagnostic Reason */}
            <div className="bg-[#F7F4EC] border border-[#D9DED8] rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#18211F] mb-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#176B5B]" />
                <span>Technician’s Inspection & Reason</span>
              </div>
              <p className="text-xs text-[#5A6661] leading-relaxed">
                {sampleQuote.reason}
              </p>
              {sampleQuote.findings && (
                <div className="mt-2.5 pt-2.5 border-t border-[#D9DED8]/70 text-[11px] text-[#7C8681]">
                  <strong className="text-[#18211F]">Preventive Value:</strong> {sampleQuote.findings}
                </div>
              )}
            </div>

            {/* Itemized Breakdown Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7C8681]">
                  ITEMIZED BREAKDOWN
                </span>
                <span className="text-xs text-[#7C8681]">Parts & Labor Guaranteed</span>
              </div>

              <div className="border border-[#D9DED8] rounded-xl overflow-hidden divide-y divide-[#D9DED8]">
                {sampleQuote.lineItems.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-start justify-between gap-4 bg-white text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#18211F]">{item.description}</span>
                        <span className="text-[10px] uppercase font-bold text-[#7C8681] px-1.5 py-0.5 bg-[#F7F4EC] rounded">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7C8681] block mt-0.5">
                        Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#18211F] flex-shrink-0">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Visual Financial Hierarchy */}
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-[#5A6661]">
                <span>Service Labor</span>
                <span className="font-mono font-medium">{formatCurrency(sampleQuote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#5A6661]">
                <span>Parts & Materials</span>
                <span className="font-mono font-medium">{formatCurrency(sampleQuote.partsTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#5A6661]">
                <span>Fixify Platform Guarantee & Coverage</span>
                <span className="font-mono font-medium">{formatCurrency(sampleQuote.platformFee)}</span>
              </div>
              <div className="pt-3 border-t border-[#D9DED8] flex justify-between items-baseline">
                <div>
                  <strong className="text-sm text-[#18211F] block">Total Authorization</strong>
                  <span className="text-[11px] text-[#7C8681]">Billed only upon verified completion</span>
                </div>
                <strong className="text-2xl font-bold font-mono text-[#18211F]">
                  {formatCurrency(sampleQuote.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Fixify Guarantee Notice */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E2EEE9]/60 border border-[#BCD4CC] text-xs text-[#176B5B]">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#176B5B]" />
              <span>
                Protected by the <strong>Fixify 12-Month Guarantee</strong>. If anything fails related to this repair, we send a technician back for free.
              </span>
            </div>

            {/* Optional Decline Explanation */}
            {showDeclineConfirm && (
              <div className="p-4 rounded-xl border border-[#D9DED8] bg-[#F7F4EC] space-y-3">
                <span className="text-xs font-bold text-[#18211F] block">
                  Please let the technician know why you are declining:
                </span>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Would prefer to address this next month, or would like a second opinion..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-[#D9DED8] rounded-lg outline-none focus:border-[#176B5B]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision('declined')}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg hover:bg-[#b91c1c] transition-colors"
                  >
                    Confirm Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeclineConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-[#D9DED8] text-xs font-medium rounded-lg text-[#5A6661]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 border-t border-[#D9DED8] bg-[#F7F4EC] space-y-3">
            <button
              type="button"
              onClick={() => handleDecision('approved')}
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 text-white font-bold text-sm rounded-[12px] shadow-[0_10px_24px_rgba(23,107,91,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span>Authorizing...</span>
              ) : (
                <>
                  <span>Approve work ({formatCurrency(sampleQuote.totalAmount)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!showDeclineConfirm && (
              <button
                type="button"
                onClick={() => setShowDeclineConfirm(true)}
                disabled={isPending}
                className="w-full py-2.5 text-xs font-semibold text-[#5A6661] hover:text-[#DC2626] transition-colors"
              >
                Decline quote or request clarification
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
