'use client';

import { useState, useTransition } from 'react';
import { submitInspectionAction } from '@/app/professional/actions';
import { useRouter } from 'next/navigation';

interface InspectionFormProps {
  jobId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * InspectionForm: Record on-site inspection findings
 * - Findings textarea (required, min 20 chars)
 * - Optional recommendation dropdown
 * - Photo/evidence upload placeholder
 * - Loading, error, and success states
 * - Keyboard accessible, labeled inputs, ARIA support
 */
export function InspectionForm({
  jobId,
  onSuccess,
  onCancel,
}: InspectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [findings, setFindings] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const findingsLength = findings.trim().length;
  const isValid = findingsLength >= 20;

  function handlePhotoUrlChange(index: number, value: string) {
    setPhotoUrls((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function addPhotoUrl() {
    setPhotoUrls((prev) => [...prev, '']);
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValid) {
      setErrorMessage('Findings must be at least 20 characters.');
      return;
    }

    startTransition(async () => {
      const res = await submitInspectionAction({
        jobId,
        findings,
        recommendation,
      });

      if (res.success) {
        setSuccessMessage('Inspection findings recorded. Moving to quote phase...');
        router.refresh();
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } else {
        setErrorMessage(res.error || 'Failed to submit inspection');
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
          On-Site Inspection
        </div>
        <h3 className="text-base font-bold text-[#18211F]">
          Record Your Findings
        </h3>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 space-y-6">
        {/* Findings Textarea */}
        <div>
          <label
            htmlFor="findings"
            className="block text-sm font-bold text-[#18211F] mb-2"
          >
            On-Site Findings
            <span className="text-[#9B3535]">*</span>
          </label>
          <textarea
            id="findings"
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Describe what you found on-site: condition of the property, identified issues, damage assessment, etc. (minimum 20 characters)"
            required
            minLength={20}
            maxLength={2000}
            aria-required="true"
            aria-describedby="findings-help"
            className="w-full px-4 py-3 border border-[#D9DED8] rounded-lg text-sm text-[#18211F] placeholder-[#7C8681] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent transition resize-none"
            rows={6}
          />
          <div
            id="findings-help"
            className="flex items-center justify-between mt-2 text-xs text-[#5A6661]"
          >
            <span>Clear, detailed findings help the customer understand the scope of work.</span>
            <span
              aria-live="polite"
              className={findingsLength < 20 ? 'text-[#9B3535]' : 'text-[#176B5B]'}
            >
              {findingsLength}/2000
            </span>
          </div>
        </div>

        {/* Recommendation Dropdown */}
        <div>
          <label
            htmlFor="recommendation"
            className="block text-sm font-bold text-[#18211F] mb-2"
          >
            Recommended Action
          </label>
          <select
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full px-4 py-3 border border-[#D9DED8] rounded-lg text-sm text-[#18211F] bg-white focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent transition"
          >
            <option value="">Select an action (optional)</option>
            <option value="replace">Replace the component</option>
            <option value="repair">Repair the component</option>
            <option value="monitor">Monitor for now</option>
            <option value="other">Other / Under review</option>
          </select>
        </div>

        {/* Photo/Evidence URLs (Placeholder for Future File Upload) */}
        <div>
          <label className="block text-sm font-bold text-[#18211F] mb-2">
            Evidence Photos
          </label>
          <p className="text-xs text-[#5A6661] mb-3">
            Add photo URLs from your camera/phone to document the condition.
            (Future: direct upload to come in next phase)
          </p>
          <div className="space-y-2">
            {photoUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handlePhotoUrlChange(idx, e.target.value)}
                  placeholder={`Photo URL ${idx + 1}`}
                  className="flex-1 px-4 py-2 border border-[#D9DED8] rounded-lg text-sm text-[#18211F] placeholder-[#7C8681] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent transition"
                />
                {photoUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhotoUrl(idx)}
                    className="px-3 py-2 text-xs font-bold text-[#9B3535] border border-[#DFC0C0] rounded-lg hover:bg-[#F5E6E6] transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPhotoUrl}
            className="mt-2 text-xs font-bold text-[#176B5B] hover:underline"
          >
            + Add another photo URL
          </button>
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
          {isPending ? 'Recording...' : 'Record Findings'}
        </button>
      </div>
    </form>
  );
}
