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
      address:addresses(id, label, city, address_line_1, latitude, longitude),
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
    .select("id, label, city, address_line_1, latitude, longitude, created_at")
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
