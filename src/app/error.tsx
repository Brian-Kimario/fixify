'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { StatusPage, statusBtnGhost, statusBtnPrimary } from '@/components/marketing/status-page';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <StatusPage
      kicker="Something went wrong"
      title="That didn’t work on our side."
      detail={error.digest ? `Reference: ${error.digest}` : undefined}
      actions={
        <>
          <button type="button" onClick={reset} className={statusBtnPrimary}>Try again</button>
          <Link href="/" className={statusBtnGhost}>Back to home</Link>
        </>
      }
    >
      <p>We hit an unexpected problem. Nothing you submitted has been lost. Try again, and if it keeps happening, quote the reference below when you contact us.</p>
    </StatusPage>
  );
}
