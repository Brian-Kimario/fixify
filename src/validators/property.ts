import { z } from 'zod';
import { uuid } from './common';

/** Values offered in the property form. The column has no CHECK constraint, so older rows may differ. */
export const PROPERTY_TYPES = ['house', 'apartment', 'villa', 'office', 'shop', 'other'] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const coordinate = (min: number, max: number) => z.number().min(min).max(max).nullable().optional();

/** One form creates or edits a property together with the address it sits at. */
export const propertyFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the property a name.').max(80),
    propertyType: z.enum(PROPERTY_TYPES, { message: 'Choose a property type.' }),
    notes: optionalText(500),
    addressLine1: z.string().trim().min(1, 'Enter the street address.').max(200),
    addressLine2: optionalText(200),
    area: optionalText(100),
    city: z.string().trim().min(1, 'Enter the city.').max(100),
    stateRegion: optionalText(100),
    postalCode: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{6}$/.test(v), 'PIN code is 6 digits.'),
    accessNotes: optionalText(500),
    latitude: coordinate(-90, 90),
    longitude: coordinate(-180, 180),
  })
  .refine((v) => (v.latitude == null) === (v.longitude == null), {
    message: 'Location needs both latitude and longitude.',
    path: ['latitude'],
  });

export const updatePropertySchema = z.object({ propertyId: uuid, values: propertyFormSchema });
export const deletePropertySchema = z.object({ propertyId: uuid });
export const deleteAddressSchema = z.object({ addressId: uuid });

export type PropertyFormInput = z.input<typeof propertyFormSchema>;
export type PropertyFormValues = z.output<typeof propertyFormSchema>;
