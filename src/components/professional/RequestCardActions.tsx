'use client';

import { useState, useTransition } from 'react';
import { updateJobState } from '@/lib/services/jobs';
import { useRouter } from 'next/navigation';

interface RequestCardActionsProps {
  jobId: string;
}

export function RequestCardActions({ jobId }: RequestCardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAction(newState: 'accepted' | 'cancelled') {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await updateJobState(jobId, newState);
        if (result.success) {
          router.refresh();
        } else {
          setErrorMsg('error' in result ? result.error : 'Failed to update request');
        }
      } catch (err) {
        setErrorMsg('An unexpected error occurred.');
      }
    });
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAction('cancelled')}
          disabled={isPending}
          className="flex-1 min-h-[48px] px-4 py-3 border border-[#D9DED8] rounded-xl text-sm font-bold text-[#5A6661] hover:bg-[#F5E6E6] hover:text-[#9B3535] hover:border-[#DFC0C0] transition disabled:opacity-50 flex items-center justify-center"
        >
          {isPending ? 'Processing…' : 'Decline'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('accepted')}
          disabled={isPending}
          className="flex-1 min-h-[48px] px-4 py-3 bg-[#176B5B] text-white rounded-xl text-sm font-bold hover:bg-[#0D5144] transition disabled:opacity-50 flex items-center justify-center shadow-sm"
        >
          {isPending ? 'Accepting…' : 'Accept Request'}
        </button>
      </div>
      {errorMsg && (
        <p className="text-[11px] text-[#9B3535]">{errorMsg}</p>
      )}
    </div>
  );
}
