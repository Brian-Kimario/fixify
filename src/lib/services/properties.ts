/**
 * Properties Service
 * 
 * Handles all property-related database operations with RLS enforcement.
 * The Supabase client automatically applies RLS policies, so authenticated
 * users will only see/modify their own properties.
 */

import { createClient } from '@/lib/supabase/server'

export interface Property {
  id: string
  owner_customer_id: string
  name: string
  property_type: 'house' | 'apartment' | 'office' | 'shop' | 'rental' | 'other'
  address_id: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PropertyWithAddress extends Property {
  address: {
    id: string
    label: string
    address_line_1: string
    address_line_2: string | null
    city: string
    state_region: string | null
    postal_code: string | null
    area: string | null
  }
}

/**
 * Fetch all properties for the authenticated customer
 * RLS will automatically filter to only customer's properties
 */
export async function getCustomerProperties(): Promise<PropertyWithAddress[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      address:addresses (
        id,
        label,
        address_line_1,
        address_line_2,
        city,
        state_region,
        postal_code,
        area
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  return (data || []) as PropertyWithAddress[]
}

/**
 * Fetch a single property by ID
 * RLS will verify the customer owns this property
 */
export async function getProperty(propertyId: string): Promise<PropertyWithAddress | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      address:addresses (
        id,
        label,
        address_line_1,
        address_line_2,
        city,
        state_region,
        postal_code,
        area
      )
    `)
    .eq('id', propertyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found - either doesn't exist or customer doesn't own it
      return null
    }
    console.error('Error fetching property:', error)
    throw new Error(`Failed to fetch property: ${error.message}`)
  }

  return data as PropertyWithAddress
}

/**
 * Create a new property for the authenticated customer
 * RLS will automatically set owner_customer_id to the authenticated user
 */
export async function createProperty(
  name: string,
  propertyType: Property['property_type'],
  addressId: string,
  notes?: string
): Promise<Property> {
  const supabase = await createClient()

  // Get current user to verify they own the address
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Verify the address belongs to the customer (RLS will handle this)
  const { data: addressData, error: addressError } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('customer_id', user.id)
    .single()

  if (addressError || !addressData) {
    throw new Error('Address not found or does not belong to you')
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      owner_customer_id: user.id,
      name,
      property_type: propertyType,
      address_id: addressId,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating property:', error)
    throw new Error(`Failed to create property: ${error.message}`)
  }

  return data as Property
}

/**
 * Update a property
 * RLS will verify the customer owns this property before allowing update
 */
export async function updateProperty(
  propertyId: string,
  updates: {
    name?: string
    property_type?: Property['property_type']
    notes?: string | null
  }
): Promise<Property> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Property not found or does not belong to you')
    }
    console.error('Error updating property:', error)
    throw new Error(`Failed to update property: ${error.message}`)
  }

  return data as Property
}

/**
 * Delete a property
 * RLS will verify the customer owns this property before allowing delete
 */
export async function deleteProperty(propertyId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('properties').delete().eq('id', propertyId)

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Property not found or does not belong to you')
    }
    console.error('Error deleting property:', error)
    throw new Error(`Failed to delete property: ${error.message}`)
  }
}

/**
 * Get property statistics for dashboard
 */
export async function getPropertyStats(): Promise<{
  totalProperties: number
  propertyTypes: { [key: string]: number }
}> {
  const properties = await getCustomerProperties()

  const propertyTypes: { [key: string]: number } = {}
  properties.forEach((prop) => {
    propertyTypes[prop.property_type] = (propertyTypes[prop.property_type] || 0) + 1
  })

  return {
    totalProperties: properties.length,
    propertyTypes,
  }
}
