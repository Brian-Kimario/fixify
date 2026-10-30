/**
 * Pure rules for job messaging. The state list mirrors `send_job_message` in
 * `20261030_017_job_messages.sql`; the database is what actually enforces it.
 */
export const MESSAGING_OPEN_STATES: ReadonlySet<string> = new Set([
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
  'quote_pending',
]);

export type ThreadAvailability = 'not_open' | 'open' | 'read_only';

/** `not_open` before the professional accepts, `read_only` once the job has ended. */
export function threadAvailability(jobState: string): ThreadAvailability {
  if (MESSAGING_OPEN_STATES.has(jobState)) return 'open';
  return jobState === 'assigned' ? 'not_open' : 'read_only';
}
