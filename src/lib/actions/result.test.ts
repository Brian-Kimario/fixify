import { describe, expect, it } from 'vitest';
import { fail, ok, parseInput } from './result';
import { createBookingSchema, createQuoteSchema, respondToQuoteSchema } from '@/validators';

const ID = '3f1c2a9e-8b7d-4c6e-9a1b-2d3e4f5a6b7c';

describe('action results', () => {
  it('builds success and failure shapes', () => {
    expect(ok()).toEqual({ success: true, data: undefined });
    expect(ok({ id: ID })).toEqual({ success: true, data: { id: ID } });
    expect(fail('rejected', 'no')).toEqual({ success: false, code: 'rejected', error: 'no' });
  });

  it('returns invalid_input with per-field messages', () => {
    const res = parseInput(respondToQuoteSchema, { quoteId: 'sample-1', jobId: ID, decision: 'maybe' });
    expect(res.success).toBe(false);
    if (res.success === false) {
      expect(res.code).toBe('invalid_input');
      expect(Object.keys(res.fieldErrors ?? {})).toEqual(expect.arrayContaining(['quoteId', 'decision']));
    }
  });

  it('trims and accepts valid input', () => {
    const res = parseInput(respondToQuoteSchema, { quoteId: ID, jobId: ID, decision: 'declined', reason: '  too high  ' });
    expect(res).toEqual({ success: true, data: { quoteId: ID, jobId: ID, decision: 'declined', reason: 'too high' } });
  });
});

describe('schemas', () => {
  it('requires an ISO datetime for bookings', () => {
    const base = { serviceId: ID, propertyId: ID };
    expect(createBookingSchema.safeParse({ ...base, scheduledStart: '2026-11-01T10:00:00.000Z' }).success).toBe(true);
    expect(createBookingSchema.safeParse({ ...base, scheduledStart: 'tomorrow' }).success).toBe(false);
  });

  it('rejects quotes with no items or non-positive prices', () => {
    const base = { jobId: ID, reason: 'Extra pipe' };
    expect(createQuoteSchema.safeParse({ ...base, lineItems: [] }).success).toBe(false);
    const item = { itemType: 'material', description: 'Pipe', quantity: 1, unitPrice: 0 };
    expect(createQuoteSchema.safeParse({ ...base, lineItems: [item] }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...base, lineItems: [{ ...item, unitPrice: 250 }] }).success).toBe(true);
  });
});
