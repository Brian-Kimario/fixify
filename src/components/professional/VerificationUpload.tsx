'use client';

/**
 * VerificationUpload — Professional-facing document upload component.
 *
 * Lets professionals upload:
 *   • Government-issued ID
 *   • Professional licence
 *   • Liability insurance certificate
 *   • Background check
 *
 * Each file is validated client-side (size, type) before calling the
 * `uploadVerificationDocument` server action via FormData.
 */

import { useState, useRef, useCallback } from 'react';
import { uploadVerificationDocument } from '@/lib/services/verification';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type DocumentType = 'license' | 'insurance' | 'id' | 'background_check';
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface DocumentSlot {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: 'id',
    label: 'Government-issued ID',
    description: 'Passport, Aadhaar, or driving licence',
    required: true,
  },
  {
    type: 'license',
    label: 'Professional Licence',
    description: 'Trade certificate or professional licence',
    required: true,
  },
  {
    type: 'insurance',
    label: 'Insurance Certificate',
    description: 'Current liability insurance document',
    required: false,
  },
  {
    type: 'background_check',
    label: 'Background Check',
    description: 'Police clearance or background verification',
    required: false,
  },
];

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf';
const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface DropzoneProps {
  slot: DocumentSlot;
  onFile: (file: File, type: DocumentType) => void;
  uploadState: UploadState;
  uploadedFileName: string | null;
  errorMsg: string | null;
}

function Dropzone({ slot, onFile, uploadState, uploadedFileName, errorMsg }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return `File exceeds ${MAX_SIZE_MB} MB limit.`;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) return 'Only JPEG, PNG, WEBP and PDF files are accepted.';
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validate(file);
    if (err) {
      // Surface via parent error state — we let the parent call onFile to trigger
      // the server action which will re-validate, but surface client-side msg too.
      // The parent's errorMsg prop will show it.
      onFile(Object.assign(file, { __clientError: err }) as File, slot.type);
    } else {
      onFile(file, slot.type);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const err = validate(file);
      if (err) {
        onFile(Object.assign(file, { __clientError: err }) as File, slot.type);
      } else {
        onFile(file, slot.type);
      }
    },
    [onFile, slot.type],
  );

  const isSuccess = uploadState === 'success';
  const isUploading = uploadState === 'uploading';
  const isError = uploadState === 'error';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[#18211F]">{slot.label}</span>
        {slot.required && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F3E1DA] text-[#A9523D] rounded uppercase tracking-wide">
            Required
          </span>
        )}
        {isSuccess && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#C7DCCF] text-[#2F7D5B] rounded uppercase tracking-wide flex items-center gap-1">
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="2,6 5,9 10,3" />
            </svg>
            Uploaded
          </span>
        )}
      </div>

      <p className="text-xs text-[#7C8681]">{slot.description}</p>

      <div
        className={[
          'relative rounded-xl border-2 border-dashed transition cursor-pointer',
          isDragging ? 'border-[#5FE3B0] bg-[#E2EEE9]' : '',
          isSuccess ? 'border-[#5FE3B0] bg-[#E2EEE9]/50' : '',
          isError ? 'border-[#D9534F] bg-[#F3E1DA]/30' : '',
          !isDragging && !isSuccess && !isError
            ? 'border-[#D9DED8] bg-[#FFFEFA] hover:border-[#5FE3B0] hover:bg-[#E2EEE9]/30'
            : '',
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={`Upload ${slot.label}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={handleChange}
          disabled={isUploading}
        />

        <div className="px-4 py-5 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-6 h-6 animate-spin text-[#5FE3B0]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-xs text-[#5A6661]">Uploading…</span>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#2F7D5B]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-xs font-semibold text-[#2F7D5B] truncate max-w-[180px]">
                {uploadedFileName}
              </span>
              <span className="text-[11px] text-[#5A6661]">Click to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#7C8681]" fill="none" stroke="currentColor" strokeWidth="1.65">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-[#5A6661]">
                Drop file or <span className="text-[#0D5144] font-semibold">browse</span>
              </span>
              <span className="text-[11px] text-[#7C8681]">JPEG, PNG, WEBP, PDF · max {MAX_SIZE_MB} MB</span>
            </div>
          )}
        </div>
      </div>

      {isError && errorMsg && (
        <p className="text-xs text-[#A9523D] font-medium">{errorMsg}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface SlotStatus {
  state: UploadState;
  fileName: string | null;
  error: string | null;
}

interface VerificationUploadProps {
  /** Called when at least one required doc has been successfully uploaded */
  onSubmitted?: () => void;
}

export default function VerificationUpload({ onSubmitted }: VerificationUploadProps) {
  const [slotStatuses, setSlotStatuses] = useState<Record<DocumentType, SlotStatus>>(
    () =>
      Object.fromEntries(
        DOCUMENT_SLOTS.map((s) => [s.type, { state: 'idle', fileName: null, error: null }]),
      ) as Record<DocumentType, SlotStatus>,
  );
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const uploadedRequiredCount = DOCUMENT_SLOTS.filter(
    (s) => s.required && slotStatuses[s.type].state === 'success',
  ).length;
  const requiredCount = DOCUMENT_SLOTS.filter((s) => s.required).length;
  const allRequiredDone = uploadedRequiredCount === requiredCount;

  const handleFile = useCallback(async (file: File, docType: DocumentType) => {
    // Client-side error injected by dropzone
    const clientError = (file as File & { __clientError?: string }).__clientError;
    if (clientError) {
      setSlotStatuses((prev) => ({
        ...prev,
        [docType]: { state: 'error', fileName: file.name, error: clientError },
      }));
      return;
    }

    setSlotStatuses((prev) => ({
      ...prev,
      [docType]: { state: 'uploading', fileName: file.name, error: null },
    }));
    setGlobalMessage(null);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('docType', docType);

    const result = await uploadVerificationDocument(formData);

    if (result.success) {
      setSlotStatuses((prev) => ({
        ...prev,
        [docType]: { state: 'success', fileName: file.name, error: null },
      }));
    } else {
      setSlotStatuses((prev) => ({
        ...prev,
        [docType]: { state: 'error', fileName: file.name, error: result.error ?? 'Upload failed' },
      }));
    }
  }, []);

  const handleSubmit = () => {
    if (!allRequiredDone) {
      setGlobalMessage('Please upload all required documents before submitting.');
      return;
    }
    setGlobalMessage("✓ Documents submitted for review. We'll notify you within 1-2 business days.");
    onSubmitted?.();
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#D9DED8]">
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
          STEP 4 OF 6
        </div>
        <h2 className="text-lg font-bold text-[#18211F]">Identity &amp; Verification Documents</h2>
        <p className="text-sm text-[#5A6661] mt-1">
          Upload your credentials to start accepting jobs. All documents are encrypted and stored
          securely.
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-5 md:px-6 py-3 bg-[#F7F4EC]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#5A6661]">Required documents</span>
          <span className="text-xs font-bold text-[#18211F]">
            {uploadedRequiredCount} / {requiredCount}
          </span>
        </div>
        <div className="h-1.5 bg-[#D9DED8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5FE3B0] rounded-full transition-all duration-500"
            style={{ width: `${(uploadedRequiredCount / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Document slots */}
      <div className="px-5 md:px-6 py-5 space-y-6">
        {DOCUMENT_SLOTS.map((slot) => (
          <Dropzone
            key={slot.type}
            slot={slot}
            onFile={handleFile}
            uploadState={slotStatuses[slot.type].state}
            uploadedFileName={slotStatuses[slot.type].fileName}
            errorMsg={slotStatuses[slot.type].error}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 md:px-6 py-4 border-t border-[#D9DED8] bg-[#F7F4EC]">
        {globalMessage && (
          <p
            className={`text-sm font-medium mb-3 ${
              globalMessage.startsWith('✓') ? 'text-[#2F7D5B]' : 'text-[#A9523D]'
            }`}
          >
            {globalMessage}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-[#7C8681]">
            Documents are reviewed within 1–2 business days.
          </p>
          <button
            onClick={handleSubmit}
            disabled={!allRequiredDone}
            className={[
              'flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition',
              allRequiredDone
                ? 'bg-[#18211F] text-white hover:bg-[#0D5144] active:scale-[0.98]'
                : 'bg-[#D9DED8] text-[#7C8681] cursor-not-allowed',
            ].join(' ')}
          >
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
