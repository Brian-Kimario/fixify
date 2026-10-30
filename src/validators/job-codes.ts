import { z } from 'zod';
import { uuid } from './common';

export const jobCodePurpose = z.enum(['start', 'finish']);
export type JobCodePurpose = z.infer<typeof jobCodePurpose>;

export const verifyJobCodeSchema = z.object({
  jobId: uuid,
  purpose: jobCodePurpose,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type VerifyJobCodeInput = z.infer<typeof verifyJobCodeSchema>;

export const reissueJobCodeSchema = z.object({ jobId: uuid });
export type ReissueJobCodeInput = z.infer<typeof reissueJobCodeSchema>;

export const reportNoShowSchema = z.object({
  jobId: uuid,
  preference: z.enum(['reassign', 'support']),
});
export type ReportNoShowInput = z.infer<typeof reportNoShowSchema>;
