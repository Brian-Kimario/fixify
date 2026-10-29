import { describe, expect, it } from 'vitest';
import {
  buildProgress,
  buildTimeline,
  describeEvent,
  eventKind,
  type CaseEvent,
  type ProgressInput,
} from './progress';

const CUSTOMER = 'cust-1';
const PRO = 'pro-1';
const OTHER_PRO = 'pro-2';
const parties = { customerId: CUSTOMER, professionalId: PRO };

let seq = 0;
function event(partial: Partial<CaseEvent> & Pick<CaseEvent, 'toState'>): CaseEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    fromState: 'none',
    actorUserId: PRO,
    eventType: 'state_transition',
    metadata: {},
    createdAt: `2026-10-30T10:${String(seq).padStart(2, '0')}:00Z`,
    ...partial,
  };
}

function job(overrides: Partial<NonNullable<ProgressInput['job']>> = {}): NonNullable<ProgressInput['job']> {
  return {
    state: 'assigned',
    professionalId: PRO,
    createdAt: '2026-10-30T09:00:00Z',
    acceptedAt: null,
    onTheWayAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

function input(overrides: Partial<ProgressInput> = {}): ProgressInput {
  return {
    role: 'customer',
    bookingCreatedAt: '2026-10-30T08:00:00Z',
    bookingCancelled: false,
    job: job(),
    events: [],
    inspection: null,
    quote: null,
    paidAt: null,
    ...overrides,
  };
}

const summary = (steps: ReturnType<typeof buildProgress>) => steps.map((s) => `${s.key}:${s.status}`);

describe('eventKind', () => {
  it('uses the column, then metadata, then the target state', () => {
    expect(eventKind({ eventType: 'quote_submitted', metadata: {}, toState: 'quote_pending' })).toBe('quote_submitted');
    expect(
      eventKind({ eventType: 'state_transition', metadata: { event_type: 'quote_approved' }, toState: 'in_progress' }),
    ).toBe('quote_approved');
    expect(eventKind({ eventType: 'state_transition', metadata: {}, toState: 'arrived' })).toBe('arrived');
  });
});

describe('describeEvent', () => {
  it('shows a professional only the offers made to them', () => {
    const toMe = event({ eventType: 'assigned', toState: 'assigned', metadata: { professional_id: PRO } });
    const toOther = event({ eventType: 'reassigned', toState: 'assigned', metadata: { professional_id: OTHER_PRO } });
    expect(describeEvent(toMe, 'professional', PRO, parties)?.title).toBe('Job offered to you');
    expect(describeEvent(toOther, 'professional', PRO, parties)).toBeNull();
    expect(describeEvent(toOther, 'customer', CUSTOMER, parties)?.title).toBe('Offered to another professional');
  });

  it('hides unmatched events from professionals', () => {
    const e = event({ eventType: 'unmatched', toState: 'assigned' });
    expect(describeEvent(e, 'professional', PRO, parties)).toBeNull();
    expect(describeEvent(e, 'customer', CUSTOMER, parties)?.title).toBe('No professional available yet');
  });

  it('names who cancelled, from the viewer’s side', () => {
    const byCustomer = event({ fromState: 'accepted', toState: 'cancelled', actorUserId: CUSTOMER });
    expect(describeEvent(byCustomer, 'customer', CUSTOMER, parties)?.title).toBe('You cancelled the job');
    expect(describeEvent(byCustomer, 'professional', PRO, parties)?.title).toBe('Cancelled by the customer');
    const bySystem = event({ fromState: 'accepted', toState: 'cancelled', actorUserId: 'admin-1' });
    expect(describeEvent(bySystem, 'customer', CUSTOMER, parties)?.title).toBe('Job cancelled');
  });

  it('reads legacy quote rows by their metadata type', () => {
    const approved = event({
      fromState: 'quote_pending',
      toState: 'in_progress',
      actorUserId: CUSTOMER,
      metadata: { event_type: 'quote_approved', quote_id: 'q1', reason: 'secret' },
    });
    expect(describeEvent(approved, 'professional', PRO, parties)?.title).toBe('Customer approved the quote');
    const resumed = event({ fromState: 'quote_pending', toState: 'in_progress' });
    expect(describeEvent(resumed, 'customer', CUSTOMER, parties)?.title).toBe('Work resumed');
  });

  it('ignores event types it does not know', () => {
    expect(describeEvent(event({ eventType: 'internal_note', toState: 'x' }), 'customer', CUSTOMER, parties)).toBeNull();
  });
});

describe('buildTimeline', () => {
  it('puts the booking first and the payment by its time, never showing metadata', () => {
    const entries = buildTimeline({
      role: 'customer',
      viewerId: CUSTOMER,
      parties,
      bookingCreatedAt: '2026-10-30T08:00:00Z',
      events: [event({ fromState: 'in_progress', toState: 'completed', metadata: { note: 'private' } })],
      paidAt: '2026-10-30T12:00:00Z',
    });
    expect(entries.map((e) => e.title)).toEqual(['You booked this visit', 'Work completed', 'You paid']);
    expect(JSON.stringify(entries)).not.toContain('private');
  });
});

describe('buildProgress', () => {
  it('has a current matching step while the booking has no job', () => {
    expect(summary(buildProgress(input({ job: null })))).toEqual(['requested:done', 'matched:current']);
  });

  it('waits on acceptance once a professional is offered the job', () => {
    const offered = event({ eventType: 'assigned', toState: 'assigned', metadata: { professional_id: PRO } });
    const steps = buildProgress(input({ events: [offered] }));
    expect(summary(steps).slice(0, 4)).toEqual(['requested:done', 'matched:done', 'accepted:current', 'on_the_way:upcoming']);
    expect(steps.find((s) => s.key === 'matched')?.at).toBe(offered.createdAt);
  });

  it('marks a step done when a later one happened without its timestamp', () => {
    const steps = buildProgress(input({ job: job({ state: 'arrived', acceptedAt: 'a', arrivedAt: '2026-10-30T11:00:00Z' }) }));
    expect(steps.find((s) => s.key === 'on_the_way')?.status).toBe('done');
    expect(steps.find((s) => s.key === 'started')?.status).toBe('current');
  });

  it('asks the right party for a pending quote', () => {
    const base = input({
      job: job({ state: 'quote_pending', acceptedAt: 'a', onTheWayAt: 'b', arrivedAt: 'c', startedAt: '2026-10-30T11:00:00Z' }),
      quote: { id: 'q1', status: 'pending_customer', createdAt: '2026-10-30T11:30:00Z', updatedAt: null },
    });
    const forCustomer = buildProgress(base);
    expect(forCustomer.find((s) => s.status === 'current')?.label).toBe('Your approval');
    expect(buildProgress({ ...base, role: 'professional' }).find((s) => s.status === 'current')?.label).toBe(
      'Customer approval',
    );
  });

  it('places an inspection made before work started ahead of it', () => {
    const steps = buildProgress(
      input({
        job: job({ state: 'in_progress', acceptedAt: 'a', onTheWayAt: 'b', arrivedAt: 'c', startedAt: '2026-10-30T11:00:00Z' }),
        inspection: { createdAt: '2026-10-30T10:55:00Z' },
      }),
    );
    const keys = steps.map((s) => s.key);
    expect(keys.indexOf('inspection')).toBeLessThan(keys.indexOf('started'));
    expect(steps.find((s) => s.key === 'completed')?.status).toBe('current');
  });

  it('dates a quote answer from its event', () => {
    const answered = event({
      eventType: 'quote_declined',
      fromState: 'quote_pending',
      toState: 'in_progress',
      metadata: { quote_id: 'q1' },
    });
    const steps = buildProgress(
      input({
        job: job({ state: 'in_progress', acceptedAt: 'a', onTheWayAt: 'b', arrivedAt: 'c', startedAt: 'd' }),
        events: [answered],
        quote: { id: 'q1', status: 'declined', createdAt: '2026-10-30T09:30:00Z', updatedAt: '2026-10-30T23:00:00Z' },
      }),
    );
    const answer = steps.find((s) => s.key === 'quote_answer');
    expect(answer).toMatchObject({ label: 'Quote declined', at: answered.createdAt, status: 'done' });
  });

  it('waits on payment after completion, and finishes once paid', () => {
    const done = job({ state: 'completed', acceptedAt: 'a', completedAt: '2026-10-30T12:00:00Z' });
    expect(buildProgress(input({ job: done })).at(-1)).toMatchObject({ key: 'paid', status: 'current' });
    const paid = buildProgress(input({ job: done, paidAt: '2026-10-30T12:05:00Z' }));
    expect(paid.every((s) => s.status === 'done')).toBe(true);
  });

  it('drops the payment step for a job closed without one', () => {
    const steps = buildProgress(input({ job: job({ state: 'closed', completedAt: 'x' }) }));
    expect(steps.map((s) => s.key)).not.toContain('paid');
    expect(steps.every((s) => s.status === 'done')).toBe(true);
  });

  it('ends a cancelled job at the cancellation', () => {
    const steps = buildProgress(
      input({ job: job({ state: 'cancelled', acceptedAt: 'a', cancelledAt: '2026-10-30T10:00:00Z' }) }),
    );
    expect(summary(steps)).toEqual(['requested:done', 'matched:done', 'accepted:done', 'cancelled:done']);
  });

  it('shows a cancelled booking without a job as cancelled', () => {
    expect(summary(buildProgress(input({ job: null, bookingCancelled: true })))).toEqual([
      'requested:done',
      'cancelled:done',
    ]);
  });
});
