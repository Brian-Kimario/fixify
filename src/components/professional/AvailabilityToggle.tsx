'use client';

import { useState, useTransition } from 'react';
import { updateAvailabilityStatus } from '@/app/professional/actions';

interface AvailabilityToggleProps {
  initialStatus: boolean;
}

export function AvailabilityToggle({ initialStatus }: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleToggle() {
    const nextStatus = !isAvailable;
    setIsAvailable(nextStatus);

    startTransition(async () => {
      try {
        await updateAvailabilityStatus(nextStatus);
        setToastMessage(nextStatus ? 'Status: You are now Online' : 'Status: You are now Offline');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        // Rollback on error
        setIsAvailable(!nextStatus);
        setToastMessage('Failed to update status. Please try again.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  }

  return (
    <div className="relative">
      <div className={`border rounded-xl p-5 md:p-6 transition-all duration-300 ${
        isAvailable 
          ? 'bg-gradient-to-br from-[#E2EEE9] to-[#FFFEFA] border-[#C8DDD5]' 
          : 'bg-[#F9FAF8] border-[#D9DED8]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#18211F]">
                {isAvailable ? 'Online' : 'Offline'}
              </span>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                isAvailable 
                  ? 'bg-[#E2EEE9] text-[#176B5B] border-[#B8D5CB]' 
                  : 'bg-[#F1EEE5] text-[#7C8681] border-[#D9DED8]'
              }`}>
                {isAvailable ? 'Dispatching' : 'Paused'}
              </span>
            </div>
            <div className="text-xs text-[#5A6661] mt-1">
              {isAvailable 
                ? 'Available for new customer jobs · live route active' 
                : 'Not receiving new nearby service alerts'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isAvailable ? 'bg-[#2F7D5B] animate-pulse' : 'bg-[#A3ACA6]'
              }`} />
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending}
              className={`min-h-[48px] px-5 py-3 text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center ${
                isAvailable
                  ? 'bg-[#FFFEFA] border border-[#C8DDD5] text-[#176B5B] hover:bg-[#F1EEE5]'
                  : 'bg-[#176B5B] text-white hover:bg-[#0D5144]'
              } disabled:opacity-50`}
            >
              {isPending 
                ? 'Updating…' 
                : isAvailable 
                  ? 'Go Offline' 
                  : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-center z-20">
          <div className="px-3 py-1 bg-[#18211F] text-[#FFFEFA] text-xs font-medium rounded-full shadow-lg transition-all animate-fade-in">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
