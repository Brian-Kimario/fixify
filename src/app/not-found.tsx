import Link from 'next/link';
import { StatusPage, statusBtnGhost, statusBtnPrimary } from '@/components/marketing/status-page';

export default function NotFoundPage() {
  return (
    <StatusPage
      kicker="Error 404"
      title="We couldn’t find that page."
      actions={
        <>
          <Link href="/" className={statusBtnPrimary}>Back to home</Link>
          <Link href="/help" className={statusBtnGhost}>Open help centre</Link>
        </>
      }
    >
      <p>The link may be old, or the page may have moved. Your jobs and property record are safe.</p>
    </StatusPage>
  );
}
