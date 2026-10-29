import { z } from 'zod';
import { uuid } from './common';

export const createBookingSchema = z.object({
  serviceId: uuid,
  propertyId: uuid,
  scheduledStart: z.iso.datetime({ offset: true, message: 'Choose a date and time' }),
  /** {service_option_id: value}; the RPC checks each pair against the service's active options. */
  selectedOptions: z.record(uuid, z.string().max(200)).optional(),
  /** Shown to offered professionals before they accept, so it must not hold access codes. */
  problemSummary: z.string().trim().max(1000).optional(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
