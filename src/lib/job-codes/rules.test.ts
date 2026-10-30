import { describe, expect, it } from 'vitest';
import { NO_SHOW_GRACE_MINUTES, noShowEligibility, noShowOpensAt, verifyFailureMessage } from './rules';

const start = '2026-11-02T04:30:00Z'; // 10:00 IST

describe('noShowEligibility', () => {
  const base = { state: 'on_the_way', arrivedAt: null, scheduledStart: start, reported: false };

  it('opens exactly 30 minutes after the scheduled start, in absolute time', () => {
    expect(NO_SHOW_GRACE_MINUTES).toBe(30);
    expect(noShowOpensAt(start).toISOString()).toBe('2026-11-02T05:00:00.000Z');
  });

  it('is too early before the grace period ends, including the last second', () => {
    const early = noShowEligibility({ ...base, now: new Date('2026-11-02T04:59:59Z') });
    expect(early.status).toBe('too_early');
  });

  it('is eligible from the boundary onward', () => {
    expect(noShowEligibility({ ...base, now: new Date('2026-11-02T05:00:00Z') }).status).toBe('eligible');
    expect(noShowEligibility({ ...base, state: 'accepted', now: new Date('2026-11-03T00:00:00Z') }).status).toBe('eligible');
  });

  it('does not apply once the professional has arrived or the job moved on', () => {
    const now = new Date('2026-11-02T06:00:00Z');
    expect(noShowEligibility({ ...base, state: 'arrived', now }).status).toBe('not_applicable');
    expect(noShowEligibility({ ...base, arrivedAt: '2026-11-02T05:10:00Z', now }).status).toBe('not_applicable');
    expect(noShowEligibility({ ...base, state: 'assigned', now }).status).toBe('not_applicable');
    expect(noShowEligibility({ ...base, state: 'cancelled', now }).status).toBe('not_applicable');
  });

  it('reports a duplicate', () => {
    expect(noShowEligibility({ ...base, reported: true, now: new Date('2026-11-02T06:00:00Z') }).status).toBe('already_reported');
  });
});

describe('verifyFailureMessage', () => {
  it('counts remaining tries', () => {
    expect(verifyFailureMessage('incorrect', 1)).toContain('1 try left');
    expect(verifyFailureMessage('incorrect', 4)).toContain('4 tries left');
  });
  it('never reveals anything about the code', () => {
    for (const reason of ['incorrect', 'locked', 'expired', 'already_used', 'no_code'] as const) {
      expect(verifyFailureMessage(reason, 2)).not.toMatch(/\d{6}/);
    }
  });
});
