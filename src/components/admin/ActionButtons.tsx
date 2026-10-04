'use client';

/**
 * ActionButtons — Conditional mutation buttons per case type
 *
 * Case types:
 * 1. DISPUTE: Approve Quote, Request Revision, Adjust Price
 * 2. REASSIGNMENT: Select professional and reassign
 * 3. VERIFICATION: Approve Professional, Reject Professional
 */

import React, { useState } from 'react';
import {
  resolveQuoteDispute,
  reassignJob,
  verifyProfessional,
} from '@/app/admin/actions';

interface ActionButtonsProps {
  caseType: 'dispute' | 'reassignment' | 'verification';
  caseId: string;
  onSuccess?: () => void;
}

// Modal for confirmation
function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
        <h3 className="text-lg font-bold text-[#18211F] mb-3">{title}</h3>
        <p className="text-sm text-[#666] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-[#666] hover:bg-[#F7F4EC] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded transition-colors ${
              confirmVariant === 'primary'
                ? 'bg-[#176B5B] hover:bg-[#0D5144]'
                : 'bg-[#D9534F] hover:bg-[#C9423F]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}

// Error modal
function ErrorModal({
  isOpen,
  error,
  onRetry,
  onClose,
}: {
  isOpen: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
        <h3 className="text-lg font-bold text-[#D9534F] mb-3">Error</h3>
        <p className="text-sm text-[#666] mb-6">{error}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#666] hover:bg-[#F7F4EC] rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </>
  );
}

// Toast notification
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded text-sm font-bold text-white z-50 animate-fade-in-out ${
        type === 'success' ? 'bg-[#176B5B]' : 'bg-[#D9534F]'
      }`}
    >
      {message}
    </div>
  );
}

// Dispute case buttons
function DisputeButtons({
  caseId,
  isPending,
  onSuccess,
}: {
  caseId: string;
  isPending: boolean;
  onSuccess: (message: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState<'approve' | 'revision' | 'adjust' | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await resolveQuoteDispute(caseId, 'approve_quote');
      if (result.success) {
        onSuccess('Quote approved successfully');
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowConfirm(null);
    });
  };

  const handleRevision = () => {
    startTransition(async () => {
      const result = await resolveQuoteDispute(caseId, 'request_revision');
      if (result.success) {
        onSuccess('Revision requested');
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowConfirm(null);
    });
  };

  const handleAdjust = () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    startTransition(async () => {
      const result = await resolveQuoteDispute(caseId, 'adjust_price', amount);
      if (result.success) {
        onSuccess(`Quote adjusted to ₹${amount.toLocaleString('en-IN')}`);
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowConfirm(null);
      setAdjustAmount('');
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowConfirm('approve')}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 rounded transition-colors"
      >
        {isPending ? 'Processing...' : 'Approve Quote'}
      </button>

      <button
        onClick={() => setShowConfirm('revision')}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-[#18211F] bg-[#F7F4EC] hover:bg-[#E8E6E0] disabled:opacity-50 rounded transition-colors"
      >
        {isPending ? 'Processing...' : 'Request Revision'}
      </button>

      <button
        onClick={() => setShowConfirm('adjust')}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-[#18211F] bg-[#F7F4EC] hover:bg-[#E8E6E0] disabled:opacity-50 rounded transition-colors"
      >
        {isPending ? 'Processing...' : 'Adjust Price'}
      </button>

      <ConfirmationModal
        isOpen={showConfirm === 'approve'}
        title="Approve Quote"
        message="This will approve the quote as-is. The customer will be notified."
        confirmText="Approve"
        confirmVariant="primary"
        onConfirm={handleApprove}
        onCancel={() => setShowConfirm(null)}
      />

      <ConfirmationModal
        isOpen={showConfirm === 'revision'}
        title="Request Revision"
        message="This will ask the professional to revise their quote."
        confirmText="Request"
        confirmVariant="primary"
        onConfirm={handleRevision}
        onCancel={() => setShowConfirm(null)}
      />

      {/* Adjust price modal */}
      {showConfirm === 'adjust' && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowConfirm(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
            <h3 className="text-lg font-bold text-[#18211F] mb-3">Adjust Quote Price</h3>
            <p className="text-sm text-[#666] mb-4">Enter the new quote amount (₹):</p>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-[#E8E6E0] rounded text-sm mb-4"
              disabled={isPending}
            />
            {error && <p className="text-xs text-[#D9534F] mb-4">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 text-sm font-bold text-[#666] hover:bg-[#F7F4EC] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 rounded transition-colors"
              >
                {isPending ? 'Processing...' : 'Adjust'}
              </button>
            </div>
          </div>
        </>
      )}

      <ErrorModal
        isOpen={!!error}
        error={error}
        onRetry={() => {
          setError('');
          if (showConfirm === 'approve') handleApprove();
          else if (showConfirm === 'revision') handleRevision();
          else if (showConfirm === 'adjust') handleAdjust();
        }}
        onClose={() => setError('')}
      />
    </div>
  );
}

// Reassignment case buttons
function ReassignmentButtons({
  caseId,
  isPending,
  onSuccess,
}: {
  caseId: string;
  isPending: boolean;
  onSuccess: (message: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const mockProfessionals = [
    { id: 'prof1', name: 'Raj Kumar (Plumbing)' },
    { id: 'prof2', name: 'Aisha Patel (Electrical)' },
    { id: 'prof3', name: 'Vikram Singh (Carpentry)' },
  ];

  const handleReassign = () => {
    if (!selectedProf) {
      setError('Please select a professional');
      return;
    }
    startTransition(async () => {
      const result = await reassignJob(caseId, selectedProf);
      if (result.success) {
        onSuccess('Job reassigned successfully');
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowModal(false);
      setSelectedProf('');
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 rounded transition-colors"
      >
        {isPending ? 'Processing...' : 'Reassign to Professional'}
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
            <h3 className="text-lg font-bold text-[#18211F] mb-3">Select Professional</h3>
            <p className="text-sm text-[#666] mb-4">Choose a verified, available professional:</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {mockProfessionals.map((prof) => (
                <label
                  key={prof.id}
                  className="flex items-center gap-2 p-2 hover:bg-[#F7F4EC] rounded cursor-pointer"
                >
                  <input
                    type="radio"
                    name="professional"
                    value={prof.id}
                    checked={selectedProf === prof.id}
                    onChange={(e) => setSelectedProf(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#18211F]">{prof.name}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-[#D9534F] mb-4">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-[#666] hover:bg-[#F7F4EC] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 rounded transition-colors"
              >
                {isPending ? 'Processing...' : 'Reassign'}
              </button>
            </div>
          </div>
        </>
      )}

      <ErrorModal
        isOpen={!!error}
        error={error}
        onRetry={handleReassign}
        onClose={() => setError('')}
      />
    </div>
  );
}

// Verification case buttons
function VerificationButtons({
  caseId,
  isPending,
  onSuccess,
}: {
  caseId: string;
  isPending: boolean;
  onSuccess: (message: string) => void;
}) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await verifyProfessional(caseId, 'approved');
      if (result.success) {
        onSuccess('Professional verified and approved');
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowApprove(false);
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    startTransition(async () => {
      const result = await verifyProfessional(caseId, 'rejected', rejectReason);
      if (result.success) {
        onSuccess('Professional rejected');
      } else {
        setError(result.error || 'Unknown error');
      }
      setShowReject(false);
      setRejectReason('');
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowApprove(true)}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-white bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 rounded transition-colors"
      >
        {isPending ? 'Processing...' : 'Approve Professional'}
      </button>

      <button
        onClick={() => setShowReject(true)}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-bold text-[#D9534F] bg-[#FDF5F3] hover:bg-[#F5E5E0] disabled:opacity-50 rounded transition-colors border border-[#D9534F]"
      >
        {isPending ? 'Processing...' : 'Reject Professional'}
      </button>

      <ConfirmationModal
        isOpen={showApprove}
        title="Approve Professional"
        message="This will verify and approve the professional for Fixify. They'll receive a welcome notification."
        confirmText="Approve"
        confirmVariant="primary"
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      {/* Reject modal */}
      {showReject && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowReject(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
            <h3 className="text-lg font-bold text-[#18211F] mb-3">Reject Professional</h3>
            <p className="text-sm text-[#666] mb-4">Provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Documents incomplete, credentials not verifiable"
              className="w-full px-3 py-2 border border-[#E8E6E0] rounded text-sm mb-4 h-24 resize-none"
              disabled={isPending}
            />
            {error && <p className="text-xs text-[#D9534F] mb-4">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm font-bold text-[#666] hover:bg-[#F7F4EC] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-[#D9534F] hover:bg-[#C9423F] disabled:opacity-50 rounded transition-colors"
              >
                {isPending ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </>
      )}

      <ErrorModal
        isOpen={!!error}
        error={error}
        onRetry={showApprove ? handleApprove : handleReject}
        onClose={() => setError('')}
      />
    </div>
  );
}

export function ActionButtons({ caseType, caseId, onSuccess }: ActionButtonsProps) {
  const [successMessage, setSuccessMessage] = useState('');

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
      onSuccess?.();
    }, 1500);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#18211F] mb-4">Actions</h3>

      {caseType === 'dispute' && (
        <DisputeButtons caseId={caseId} isPending={isPending} onSuccess={handleSuccess} />
      )}

      {caseType === 'reassignment' && (
        <ReassignmentButtons caseId={caseId} isPending={isPending} onSuccess={handleSuccess} />
      )}

      {caseType === 'verification' && (
        <VerificationButtons caseId={caseId} isPending={isPending} onSuccess={handleSuccess} />
      )}

      {successMessage && <Toast message={successMessage} type="success" />}
    </div>
  );
}
