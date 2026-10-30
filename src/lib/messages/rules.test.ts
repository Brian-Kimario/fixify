import { describe, expect, it } from 'vitest';
import { JOB_STATES } from '@/lib/jobs/states';
import { compareInbox, MESSAGING_OPEN_STATES, threadAvailability } from './rules';

describe('threadAvailability', () => {
  it('opens only after the professional accepts and closes when the job ends', () => {
    expect(threadAvailability('assigned')).toBe('not_open');
    for (const state of ['accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending']) {
      expect(threadAvailability(state)).toBe('open');
    }
    for (const state of ['completed', 'cancelled', 'closed']) {
      expect(threadAvailability(state)).toBe('read_only');
    }
  });

  it('only lists real job states', () => {
    for (const state of MESSAGING_OPEN_STATES) expect(JOB_STATES).toContain(state);
  });
});

describe('compareInbox', () => {
  const row = (lastMessageAt: string | null, jobCreatedAt: string) => ({ lastMessageAt, jobCreatedAt });
  it('puts the newest message first and empty conversations last', () => {
    const rows = [
      row(null, '2026-10-02T00:00:00Z'),
      row('2026-10-05T00:00:00Z', '2026-10-01T00:00:00Z'),
      row(null, '2026-10-03T00:00:00Z'),
      row('2026-10-06T00:00:00Z', '2026-09-01T00:00:00Z'),
    ].sort(compareInbox);
    expect(rows.map((r) => r.lastMessageAt ?? r.jobCreatedAt.slice(0, 10))).toEqual([
      '2026-10-06T00:00:00Z',
      '2026-10-05T00:00:00Z',
      '2026-10-03',
      '2026-10-02',
    ]);
  });
});
