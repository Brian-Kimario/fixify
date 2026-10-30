'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import {
  deleteAddressSchema,
  deletePropertySchema,
  propertyFormSchema,
  updatePropertySchema,
  type PropertyFormValues,
} from '@/validators';

/**
 * Property and address writes for the signed-in customer. RLS limits every statement to
 * the customer's own rows; ownership is never taken from the client.
 */

function addressColumns(v: PropertyFormValues) {
  return {
    label: v.name,
    address_line_1: v.addressLine1,
    address_line_2: v.addressLine2,
    area: v.area,
    city: v.city,
    state_region: v.stateRegion,
    postal_code: v.postalCode,
    access_notes: v.accessNotes,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
  };
}

function revalidate() {
  revalidatePath('/customer/properties');
  revalidatePath('/customer');
}

export async function createPropertyAction(input: unknown): Promise<ActionResult<{ propertyId: string }>> {
  const parsed = parseInput(propertyFormSchema, input);
  if (parsed.success === false) return parsed;
  const values = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in again.');

  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .insert({ ...addressColumns(values), customer_id: user.id })
    .select('id')
    .single();
  if (addressError || !address) return fail('failed', 'We couldn’t save the address. Please try again.');

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert({
      owner_customer_id: user.id,
      name: values.name,
      property_type: values.propertyType,
      notes: values.notes,
      address_id: address.id,
    })
    .select('id')
    .single();

  if (propertyError || !property) {
    // Don't leave an address behind for a property that was never created.
    await supabase.from('addresses').delete().eq('id', address.id);
    return fail('failed', 'We couldn’t save the property. Please try again.');
  }

  revalidate();
  return ok({ propertyId: property.id });
}

export async function updatePropertyAction(input: unknown): Promise<ActionResult> {
  const parsed = parseInput(updatePropertySchema, input);
  if (parsed.success === false) return parsed;
  const { propertyId, values } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in again.');

  const { data: existing, error: loadError } = await supabase
    .from('properties')
    .select('id, address_id')
    .eq('id', propertyId)
    .eq('owner_customer_id', user.id)
    .maybeSingle();
  if (loadError) return fail('failed', 'We couldn’t load that property. Please try again.');
  if (!existing) return fail('not_found', 'That property isn’t on your account.');

  const { error: addressError } = await supabase
    .from('addresses')
    .update(addressColumns(values))
    .eq('id', existing.address_id)
    .eq('customer_id', user.id);
  if (addressError) return fail('failed', 'We couldn’t update the address. Please try again.');

  const { error: propertyError } = await supabase
    .from('properties')
    .update({ name: values.name, property_type: values.propertyType, notes: values.notes })
    .eq('id', propertyId)
    .eq('owner_customer_id', user.id);
  if (propertyError) return fail('failed', 'We couldn’t update the property. Please try again.');

  revalidate();
  return ok();
}

/**
 * Removing a property cascades to its bookings and jobs in the database, so a property
 * with any booking history is kept. Only properties that were never booked can go.
 */
export async function deletePropertyAction(input: unknown): Promise<ActionResult> {
  const parsed = parseInput(deletePropertySchema, input);
  if (parsed.success === false) return parsed;
  const { propertyId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in again.');

  const { data: property, error: loadError } = await supabase
    .from('properties')
    .select('id, address_id')
    .eq('id', propertyId)
    .eq('owner_customer_id', user.id)
    .maybeSingle();
  if (loadError) return fail('failed', 'We couldn’t load that property. Please try again.');
  if (!property) return fail('not_found', 'That property isn’t on your account.');

  const { count, error: countError } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId);
  if (countError || count === null) return fail('failed', 'We couldn’t check this property’s bookings. Please try again.');
  if (count > 0) {
    return fail('rejected', 'This property has booking history, so it can’t be removed. You can still edit its details.');
  }

  const { error: deleteError } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('owner_customer_id', user.id);
  if (deleteError) return fail('failed', 'We couldn’t remove the property. Please try again.');

  // The address goes too unless another property still uses it.
  const { count: sharing } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('address_id', property.address_id);
  if (sharing === 0) await supabase.from('addresses').delete().eq('id', property.address_id).eq('customer_id', user.id);

  revalidate();
  return ok();
}

/** Deletes a saved address that no property uses. */
export async function deleteAddressAction(input: unknown): Promise<ActionResult> {
  const parsed = parseInput(deleteAddressSchema, input);
  if (parsed.success === false) return parsed;
  const { addressId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in again.');

  const { data, error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('customer_id', user.id)
    .select('id');
  if (error) {
    // 23503: a property still points at this address (ON DELETE RESTRICT).
    if (error.code === '23503') return fail('rejected', 'A property still uses this address.');
    return fail('failed', 'We couldn’t remove the address. Please try again.');
  }
  if (!data || data.length === 0) return fail('not_found', 'That address isn’t on your account.');

  revalidate();
  return ok();
}
