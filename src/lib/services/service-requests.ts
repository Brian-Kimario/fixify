/**
 * Service Requests Service
 * 
 * Handles creation and management of customer service requests (the problem description
 * before it becomes a booking). This is the intake layer where customers describe their issues.
 * 
 * RLS ensures customers can only see/modify their own service requests.
 */

import { createClient } from '@/lib/supabase/server'

export interface ServiceRequest {
  id: string
  customer_id: string
  property_id: string
  input_text: string | null
  normalized_summary: string | null
  suggested_category_id: string | null
  suggested_service_id: string | null
  classification_confidence: string | null
  intake_source: 'manual' | 'ai' | 'voice' | 'media'
  status: 'draft' | 'ready' | 'converted' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  service_category?: {
    id: string
    name: string
    slug: string
  } | null
  service?: {
    id: string
    name: string
    slug: string
  } | null
}

/**
 * Create a new service request
 */
export async function createServiceRequest(
  propertyId: string,
  inputText: string,
  intakeSource: ServiceRequest['intake_source'] = 'manual'
): Promise<ServiceRequest> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Verify the property belongs to the customer
  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('owner_customer_id', user.id)
    .single()

  if (propertyError || !propertyData) {
    throw new Error('Property not found or does not belong to you')
  }

  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      customer_id: user.id,
      property_id: propertyId,
      input_text: inputText,
      intake_source: intakeSource,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating service request:', error)
    throw new Error(`Failed to create service request: ${error.message}`)
  }

  return data as ServiceRequest
}

/**
 * Get all service requests for the authenticated customer
 */
export async function getCustomerServiceRequests(): Promise<ServiceRequestWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_requests')
    .select(
      `
      *,
      service_category:service_categories (id, name, slug),
      service:services (id, name, slug)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching service requests:', error)
    throw new Error(`Failed to fetch service requests: ${error.message}`)
  }

  return (data || []) as ServiceRequestWithDetails[]
}

/**
 * Get draft service requests (in progress)
 */
export async function getDraftServiceRequests(): Promise<ServiceRequestWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_requests')
    .select(
      `
      *,
      service_category:service_categories (id, name, slug),
      service:services (id, name, slug)
    `
    )
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching draft service requests:', error)
    throw new Error(`Failed to fetch draft service requests: ${error.message}`)
  }

  return (data || []) as ServiceRequestWithDetails[]
}

/**
 * Get a single service request by ID
 */
export async function getServiceRequest(requestId: string): Promise<ServiceRequestWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_requests')
    .select(
      `
      *,
      service_category:service_categories (id, name, slug),
      service:services (id, name, slug)
    `
    )
    .eq('id', requestId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching service request:', error)
    throw new Error(`Failed to fetch service request: ${error.message}`)
  }

  return data as ServiceRequestWithDetails
}

/**
 * Update a service request with classification results (from AI or manual)
 */
export async function updateServiceRequest(
  requestId: string,
  updates: {
    normalized_summary?: string
    suggested_category_id?: string | null
    suggested_service_id?: string | null
    classification_confidence?: string
    status?: ServiceRequest['status']
  }
): Promise<ServiceRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Service request not found or does not belong to you')
    }
    console.error('Error updating service request:', error)
    throw new Error(`Failed to update service request: ${error.message}`)
  }

  return data as ServiceRequest
}

/**
 * Mark a service request as ready to convert to booking
 */
export async function markServiceRequestReady(requestId: string): Promise<ServiceRequest> {
  return updateServiceRequest(requestId, { status: 'ready' })
}

/**
 * Mark a service request as converted (linked to a booking)
 */
export async function markServiceRequestConverted(requestId: string): Promise<ServiceRequest> {
  return updateServiceRequest(requestId, { status: 'converted' })
}

/**
 * Cancel a service request
 */
export async function cancelServiceRequest(requestId: string): Promise<ServiceRequest> {
  return updateServiceRequest(requestId, { status: 'cancelled' })
}

/**
 * Delete a service request (only drafts should be deletable)
 */
export async function deleteServiceRequest(requestId: string): Promise<void> {
  const supabase = await createClient()

  // First check if it's a draft
  const { data: requestData, error: getError } = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', requestId)
    .single()

  if (getError) {
    throw new Error('Service request not found')
  }

  if (requestData.status !== 'draft') {
    throw new Error('Only draft service requests can be deleted')
  }

  const { error: deleteError } = await supabase
    .from('service_requests')
    .delete()
    .eq('id', requestId)

  if (deleteError) {
    console.error('Error deleting service request:', deleteError)
    throw new Error(`Failed to delete service request: ${deleteError.message}`)
  }
}

/**
 * Get service request statistics
 */
export async function getServiceRequestStats(): Promise<{
  totalRequests: number
  draftRequests: number
  readyRequests: number
  convertedRequests: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_requests')
    .select('status')

  if (error) {
    console.error('Error fetching service request stats:', error)
    throw new Error(`Failed to fetch stats: ${error.message}`)
  }

  const requests = data || []
  const stats = {
    totalRequests: requests.length,
    draftRequests: requests.filter((r) => r.status === 'draft').length,
    readyRequests: requests.filter((r) => r.status === 'ready').length,
    convertedRequests: requests.filter((r) => r.status === 'converted').length,
  }

  return stats
}
