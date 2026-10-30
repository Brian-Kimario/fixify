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

/**
 * Arrival windows a professional can share, in minutes from now. report_job_eta accepts any
 * window inside the next 8 hours; these are just the choices offered.
 */
export const ARRIVAL_WINDOWS = [
  { id: 'within_15', label: 'Within 15 min', earliest: 0, latest: 15 },
  { id: '15_30', label: '15–30 min', earliest: 15, latest: 30 },
  { id: '30_60', label: '30–60 min', earliest: 30, latest: 60 },
  { id: '60_120', label: '1–2 hours', earliest: 60, latest: 120 },
] as const;
export type ArrivalWindowId = (typeof ARRIVAL_WINDOWS)[number]['id'];

export const reportEtaSchema = z.object({
  jobId: uuid,
  windowId: z.enum(ARRIVAL_WINDOWS.map((w) => w.id) as [ArrivalWindowId, ...ArrivalWindowId[]], {
    message: 'Choose when you expect to arrive.',
  }),
  runningLate: z.boolean(),
});
export type ReportEtaInput = z.input<typeof reportEtaSchema>;

/** Mirrors the job_media.kind check. */
export const JOB_MEDIA_KINDS = ['before', 'after', 'part', 'receipt'] as const;
export type JobMediaKind = (typeof JOB_MEDIA_KINDS)[number];
export const JOB_MEDIA_KIND_LABEL: Record<JobMediaKind, string> = {
  before: 'Before',
  after: 'After',
  part: 'Part',
  receipt: 'Receipt',
};

/** Mirrors the job-media bucket's allowed types. */
export const JOB_MEDIA_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
export const JOB_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export const addJobMediaSchema = z
  .object({
    jobId: uuid,
    kind: z.enum(JOB_MEDIA_KINDS, { message: 'Choose what the file shows.' }),
    // <job_id>/<uuid>.<ext>, as the uploader names it.
    storagePath: z
      .string()
      .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i, 'Invalid file path.'),
  })
  .refine((v) => v.storagePath.toLowerCase().startsWith(`${v.jobId.toLowerCase()}/`), {
    path: ['storagePath'],
    message: 'The file does not belong to this job.',
  });
export type AddJobMediaInput = z.input<typeof addJobMediaSchema>;

/** Ask for a signed upload URL; the server names the file under <job_id>/. */
export const jobMediaUploadSchema = z.object({
  jobId: uuid,
  contentType: z
    .string()
    .refine((t) => t in JOB_MEDIA_TYPES, { message: 'Use a JPG, PNG or WebP photo, or a PDF.' }),
});
export type JobMediaUploadInput = z.input<typeof jobMediaUploadSchema>;

/** Remove an upload that could not be attached. Storage RLS only allows it while unattached. */
export const discardJobMediaUploadSchema = z
  .object({
    jobId: uuid,
    storagePath: z
      .string()
      .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i, 'Invalid file path.'),
  })
  .refine((v) => v.storagePath.toLowerCase().startsWith(`${v.jobId.toLowerCase()}/`), {
    path: ['storagePath'],
    message: 'The file does not belong to this job.',
  });
export type DiscardJobMediaUploadInput = z.input<typeof discardJobMediaUploadSchema>;
