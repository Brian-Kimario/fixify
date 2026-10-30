import { describe, expect, it } from 'vitest';
import { JOB_STATES } from '@/lib/jobs/states';
import { MESSAGING_OPEN_STATES, threadAvailability } from './rules';

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
