import { getJobThread } from '@/lib/services/messages';
import { CaseCard } from '@/components/case/CaseFile';
import { MessageThread } from './MessageThread';

/**
 * The Messages card of a case file. Renders nothing until the professional has accepted,
 * because no conversation exists before then.
 */
export async function JobMessages({
  userId,
  jobId,
  jobState,
  otherName,
}: {
  userId: string;
  jobId: string;
  jobState: string;
  otherName: string;
}) {
  const thread = await getJobThread(userId, jobId, jobState);
  if (thread.availability === 'not_open') return null;

  return (
    <CaseCard title={thread.unread > 0 ? `Messages (${thread.unread} new)` : 'Messages'}>
      <MessageThread
        jobId={jobId}
        currentUserId={userId}
        otherName={otherName}
        availability={thread.availability}
        messages={thread.messages}
        unread={thread.unread}
        limits={thread.limits}
        loadFailed={thread.error}
      />
    </CaseCard>
  );
}
