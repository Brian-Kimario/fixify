"use server";

import { createClient } from "@/lib/supabase/server";
import type { Property, Address } from "./types";

/**
 * Get all properties for the authenticated customer
 * RLS ensures only the customer's properties are returned
 */
export async function getCustomerProperties(): Promise<Property[]> {
  // Create authenticated Supabase client (respects RLS)
  const supabase = await createClient();

  // Get the current user from the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Query properties - RLS will filter to only this user's properties
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      name,
      property_type,
      status,
      address:addresses(id, label, city, address_line_1, state_region, postal_code, latitude, longitude),
      created_at,
      updated_at
    `
    )
    .eq("owner_customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`);
  }

  return (data || []) as unknown as Property[];
}

/**
 * Get all addresses for the authenticated customer
 */
export async function getCustomerAddresses(): Promise<Address[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, city, address_line_1, state_region, postal_code, latitude, longitude, created_at")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch addresses: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new address for the customer
 */
export async function createAddress(addressData: {
  label: string;
  address_line_1: string;
  city: string;
  state_region?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      customer_id: user.id,
      ...addressData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create address: ${error.message}`);
  }

  return data;
}

/**
 * Delete an address for the customer
 * Requires confirmation from client before executing
 */
export async function deleteAddress(addressId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership before deleting (RLS will also enforce this)
  const { data: address, error: fetchError } = await supabase
    .from("addresses")
    .select("id, customer_id")
    .eq("id", addressId)
    .eq("customer_id", user.id)
    .single();

  if (fetchError || !address) {
    throw new Error("Address not found or does not belong to your account.");
  }

  const { error: deleteError } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);

  if (deleteError) {
    throw new Error(`Failed to delete address: ${deleteError.message}`);
  }

  return { success: true };
}

/**
 * Create a new property for the customer
 */
export async function createProperty(propertyData: {
  name: string;
  property_type: string;
  address_id: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_customer_id: user.id,
      ...propertyData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create property: ${error.message}`);
  }

  return data;
}

/**
 * Update an address for the customer
 * Requires ownership verification
 */
export async function updateAddress(
  addressId: string,
  addressData: {
    label?: string;
    address_line_1?: string;
    city?: string;
    state_region?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership before updating (RLS will also enforce this)
  const { data: address, error: fetchError } = await supabase
    .from("addresses")
    .select("id, customer_id")
    .eq("id", addressId)
    .eq("customer_id", user.id)
    .single();

  if (fetchError || !address) {
    throw new Error("Address not found or does not belong to your account.");
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(addressData)
    .eq("id", addressId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update address: ${error.message}`);
  }

  return data;
}

/**
 * Update a property for the customer
 * Requires ownership verification
 */
export async function updateProperty(
  propertyId: string,
  propertyData: {
    name?: string;
    property_type?: string;
    address_id?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership before updating (RLS will also enforce this)
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("id, owner_customer_id")
    .eq("id", propertyId)
    .eq("owner_customer_id", user.id)
    .single();

  if (fetchError || !property) {
    throw new Error("Property not found or does not belong to your account.");
  }

  const { data, error } = await supabase
    .from("properties")
    .update(propertyData)
    .eq("id", propertyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }

  return data;
}

/**
 * Delete a property for the customer
 * Verify ownership and check if property has active jobs before deleting
 */
export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership before deleting (RLS will also enforce this)
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("id, owner_customer_id")
    .eq("id", propertyId)
    .eq("owner_customer_id", user.id)
    .single();

  if (fetchError || !property) {
    throw new Error("Property not found or does not belong to your account.");
  }

  // Check if property has active bookings
  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("property_id", propertyId)
    .neq("status", "completed")
    .neq("status", "cancelled");

  if (bookingError) {
    throw new Error(`Failed to check active jobs: ${bookingError.message}`);
  }

  if (bookings && bookings.length > 0) {
    throw new Error(
      "Cannot delete property with active jobs. Please cancel or complete all jobs first."
    );
  }

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (deleteError) {
    throw new Error(`Failed to delete property: ${deleteError.message}`);
  }

  return { success: true };
}

/**
 * Update property status for the customer
 * Requires ownership verification
 */
export async function updatePropertyStatus(
  propertyId: string,
  status: 'active' | 'inactive' | 'maintenance'
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership before updating (RLS will also enforce this)
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("id, owner_customer_id")
    .eq("id", propertyId)
    .eq("owner_customer_id", user.id)
    .single();

  if (fetchError || !property) {
    throw new Error("Property not found or does not belong to your account.");
  }

  const { data, error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", propertyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update property status: ${error.message}`);
  }

  return data;
}
