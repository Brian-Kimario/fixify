'use client';

/**
 * CaseDrawer — Slide-over panel showing case details + actions
 *
 * Features:
 * - Slides in from right
 * - Tabs: Context, Job State, Details, Timeline, Actions
 * - Close via Escape, X button, or backdrop click
 * - Auto-close on action success
 */

import React, { useState, useEffect } from 'react';
import { ActionButtons } from './ActionButtons';
import { CaseTimeline } from './CaseTimeline';
import type { AttentionItem } from '@/app/admin/actions';

interface CaseDrawerProps {
  isOpen: boolean;
  case: AttentionItem | null;
  onClose: () => void;
  onActionSuccess?: () => void;
}

const tabNames = ['Context', 'Job State', 'Details', 'Timeline', 'Actions'] as const;
type TabName = (typeof tabNames)[number];

// Mock data helpers (in real implementation, these would be fetched from server)
interface CaseDetails {
  context: {
    customerName: string;
    customerEmail: string;
    professionalName: string;
    professionalEmail: string;
    propertyName: string;
    address: string;
    serviceType: string;
  };
  jobState: {
    currentState: string;
    stateEnteredAt: string;
    daysInState: number;
  };
  details: {
    quoteAmount?: number;
    originalAmount?: number;
    disputeReason?: string;
    // For reassignment
    unavailabilityReason?: string;
    // For verification
    skills?: string[];
    documentsLink?: string;
  };
  timeline: Array<{
    id: string;
    type: 'state_change' | 'admin_action' | 'customer_action' | 'system_event' | 'error';
    timestamp: string;
    actor: string;
    description: string;
  }>;
}

// Mock helper to generate case details (replace with real fetches)
function getCaseDetails(caseItem: AttentionItem | null): CaseDetails {
  if (!caseItem) {
    return {
      context: { customerName: '', customerEmail: '', professionalName: '', professionalEmail: '', propertyName: '', address: '', serviceType: '' },
      jobState: { currentState: '', stateEnteredAt: '', daysInState: 0 },
      details: {},
      timeline: [],
    };
  }

  // Parse sub line: "BOOKING_REF • SERVICE • AMOUNT" or similar
  const parts = caseItem.sub.split(' • ');
  const service = parts[1] || '';
  const amount = parts[2] || '';

  return {
    context: {
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      professionalName: 'Raj Kumar',
      professionalEmail: 'raj@example.com',
      propertyName: 'Apartment 5B',
      address: '123 Main St, Bangalore',
      serviceType: service,
    },
    jobState: {
      currentState: 'quote_pending_approval',
      stateEnteredAt: caseItem.createdAt,
      daysInState: 2,
    },
    details: {
      quoteAmount: parseInt(amount.replace(/[^0-9]/g, '')) || 5000,
      originalAmount: 4500,
      disputeReason: caseItem.type === 'dispute' ? 'Quote higher than initial estimate' : undefined,
      unavailabilityReason: caseItem.type === 'reassignment' ? 'Professional marked as unavailable' : undefined,
      skills: caseItem.type === 'verification' ? ['Plumbing', 'Bathroom Repairs'] : undefined,
      documentsLink: caseItem.type === 'verification' ? 'https://example.com/docs' : undefined,
    },
    timeline: [
      {
        id: '1',
        type: 'state_change',
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        actor: 'Raj Kumar (Professional)',
        description: 'Submitted inspection findings and quote for customer review',
      },
      {
        id: '2',
        type: 'customer_action',
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        actor: 'Jane Smith (Customer)',
        description: 'Disputed quote amount — requested clarification on labor charges',
      },
      {
        id: '3',
        type: 'system_event',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        actor: 'System',
        description: 'Case flagged for admin attention — decision needed',
      },
    ],
  };
}

export function CaseDrawer({ isOpen, case: caseItem, onClose, onActionSuccess }: CaseDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabName>('Context');
  const details = getCaseDetails(caseItem);

  // Close on Escape key
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !caseItem) return null;

  const handleActionSuccess = () => {
    onActionSuccess?.();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
        onClick={onClose}
        role="presentation"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full md:w-[40%] bg-white z-40 shadow-lg flex flex-col transition-transform"
        role="dialog"
        aria-modal="true"
        aria-label={`Case details: ${caseItem.label}`}
      >
        {/* Header */}
        <div className="border-b border-[#E8E6E0] px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#18211F]">{caseItem.label}</h2>
            <p className="text-xs text-[#999] mt-1">{caseItem.id.slice(0, 12)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F7F4EC] rounded transition-colors"
            aria-label="Close"
          >
            <span className="text-[#666]">✕</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E8E6E0] flex gap-1 px-6 bg-[#FAFAF8]">
          {tabNames.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#176B5B] text-[#176B5B]'
                  : 'border-transparent text-[#999] hover:text-[#18211F]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* Context Tab */}
            {activeTab === 'Context' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#999]">Customer</label>
                  <div className="text-sm text-[#18211F] mt-1">{details.context.customerName}</div>
                  <div className="text-xs text-[#999]">{details.context.customerEmail}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999]">Professional</label>
                  <div className="text-sm text-[#18211F] mt-1">{details.context.professionalName}</div>
                  <div className="text-xs text-[#999]">{details.context.professionalEmail}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999]">Property</label>
                  <div className="text-sm text-[#18211F] mt-1">{details.context.propertyName}</div>
                  <div className="text-xs text-[#999]">{details.context.address}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999]">Service Type</label>
                  <div className="text-sm text-[#18211F] mt-1">{details.context.serviceType}</div>
                </div>
              </div>
            )}

            {/* Job State Tab */}
            {activeTab === 'Job State' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#999]">Current State</label>
                  <div className="mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#176B5B] text-white">
                    {details.jobState.currentState}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999]">Entered At</label>
                  <div className="text-sm text-[#18211F] mt-1">
                    {new Date(details.jobState.stateEnteredAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999]">Days in State</label>
                  <div className="text-sm text-[#18211F] mt-1">{details.jobState.daysInState} days</div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'Details' && (
              <div className="space-y-3">
                {caseItem.type === 'dispute' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-[#999]">Original Amount</label>
                      <div className="text-sm text-[#18211F] mt-1">
                        ₹{(details.details.originalAmount ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#999]">Current Quote</label>
                      <div className="text-lg font-bold text-[#A9523D] mt-1">
                        ₹{(details.details.quoteAmount ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#999]">Dispute Reason</label>
                      <div className="text-sm text-[#18211F] mt-1">{details.details.disputeReason}</div>
                    </div>
                  </>
                )}

                {caseItem.type === 'reassignment' && (
                  <div>
                    <label className="text-xs font-bold text-[#999]">Unavailability Reason</label>
                    <div className="text-sm text-[#18211F] mt-1">{details.details.unavailabilityReason}</div>
                  </div>
                )}

                {caseItem.type === 'verification' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-[#999]">Skills</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(details.details.skills ?? []).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#E6EEF2] text-[#416B84]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#999]">Verification Documents</label>
                      {details.details.documentsLink && (
                        <a
                          href={details.details.documentsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#176B5B] hover:underline mt-1 block"
                        >
                          View Documents →
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'Timeline' && <CaseTimeline events={details.timeline} />}

            {/* Actions Tab */}
            {activeTab === 'Actions' && (
              <div className="py-2">
                <ActionButtons
                  caseType={caseItem.type}
                  caseId={caseItem.id}
                  onSuccess={handleActionSuccess}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
