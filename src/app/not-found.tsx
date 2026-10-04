'use client';

import { useRouter } from 'next/navigation';
import { NotFoundState } from '@/components/ui/ErrorState';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <NotFoundState
          onGoHome={() => router.push('/')}
          onGoBack={() => router.back()}
        />
      </div>
    </div>
  );
}
