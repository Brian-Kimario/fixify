import { z } from 'zod';
import { uuid } from './common';

/** The signed-in professional's own profile. Identity always comes from the session. */
export const professionalProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name (2–100 characters).').max(100, 'Enter your full name (2–100 characters).'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?[0-9 ()-]{7,20}$/.test(v), 'Enter a valid phone number.')
    .transform((v) => (v ? v : null)),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be 500 characters or fewer.')
    .transform((v) => (v ? v : null)),
  yearsExperience: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,2}$/.test(v), 'Years of experience must be a whole number from 0 to 60.')
    .transform((v) => (v === '' ? null : Number(v)))
    .refine((v) => v === null || v <= 60, 'Years of experience must be a whole number from 0 to 60.'),
  categoryIds: z
    .array(uuid)
    .max(50)
    .transform((ids) => Array.from(new Set(ids))),
});

export type ProfessionalProfileInput = z.input<typeof professionalProfileSchema>;
