import { z } from 'zod';
import { uuid } from './common';

export const jobIdSchema = uuid;

/** Mirrors the booking_assignment_attempts.reason_code check and decline_job. */
export const DECLINE_REASON_CODES = [
  'schedule_conflict',
  'too_far',
  'not_my_skill',
  'need_more_detail',
  'other',
] as const;
export type DeclineReasonCode = (typeof DECLINE_REASON_CODES)[number];

export const declineJobSchema = z
  .object({
    jobId: uuid,
    reasonCode: z.enum(DECLINE_REASON_CODES, { message: 'Choose a reason.' }),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.reasonCode !== 'other' || Boolean(v.note), {
    path: ['note'],
    message: 'Tell us why you’re declining.',
  });

export type DeclineJobInput = z.input<typeof declineJobSchema>;

export const inspectionSchema = z.object({
  jobId: uuid,
  findings: z.string().trim().min(1, 'Please describe your on-site findings.').max(5000),
  recommendation: z.string().trim().max(5000).optional(),
});

export const quoteLineItemSchema = z.object({
  itemType: z.enum(['labour', 'material', 'fee']),
  description: z.string().trim().min(1, 'Each line item needs a description.').max(300),
  quantity: z.number().positive('Quantity must be greater than 0.').max(10000),
  unitPrice: z.number().positive('Price must be greater than 0.').max(1_000_000),
});

export const createQuoteSchema = z.object({
  jobId: uuid,
  reason: z.string().trim().min(1, 'Please give a reason for this quote.').max(1000),
  lineItems: z.array(quoteLineItemSchema).min(1, 'Add at least one line item.').max(50),
});

export type InspectionInput = z.input<typeof inspectionSchema>;
export type CreateQuoteInput = z.input<typeof createQuoteSchema>;
