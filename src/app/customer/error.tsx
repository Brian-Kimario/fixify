'use client';

import { useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <ErrorState
          title="Failed to load customer dashboard"
          description="We encountered an issue while loading your dashboard. Please try again or contact support if the problem persists."
          errorCode={error.digest}
          action={{
            label: 'Try again',
            onClick: reset,
          }}
          secondaryAction={{
            label: 'Go home',
            onClick: () => router.push('/'),
          }}
        />
      </div>
    </div>
  );
}
