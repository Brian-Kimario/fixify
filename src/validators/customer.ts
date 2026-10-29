import { z } from 'zod';
import { uuid } from './common';

export const problemIntakeSchema = z.object({
  inputText: z.string().trim().min(1, 'Please describe what needs attention.').max(2000),
  propertyId: uuid.optional(),
  detectedCategory: z.string().trim().max(100).optional(),
  hasMedia: z.boolean().optional(),
});

export const respondToQuoteSchema = z.object({
  quoteId: uuid,
  jobId: uuid,
  decision: z.enum(['approved', 'declined']),
  reason: z.string().trim().max(500).optional(),
});

export type ProblemIntakeInput = z.input<typeof problemIntakeSchema>;
export type RespondToQuoteInput = z.input<typeof respondToQuoteSchema>;
