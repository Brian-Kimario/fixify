import { z } from 'zod';
import { uuid } from './common';

export const createBookingSchema = z.object({
  serviceId: uuid,
  propertyId: uuid,
  scheduledStart: z.iso.datetime({ offset: true, message: 'Choose a date and time' }),
  selectedOptions: z.record(z.string(), z.string().max(200)).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
