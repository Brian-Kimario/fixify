export interface ServiceCategory {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
}

export interface Address {
  id: string;
  city: string;
  label: string;
  address_line_1: string;
}

export interface Property {
  id: string;
  name: string;
  address: Address;
}

export interface Customer {
  id: string;
  full_name: string;
  phone?: string;
}

export interface Booking {
  id: string;
  scheduled_start: string;
  service: Service & { category: ServiceCategory };
}

export interface JobEvent {
  id: string;
  from_state: string;
  to_state: string;
  actor_user_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Job {
  id: string;
  current_state: string;
  created_at: string;
  accepted_at?: string;
  on_the_way_at?: string;
  arrived_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  customer: Customer;
  property: Property;
  booking: Booking;
  job_events?: JobEvent[];
}

export interface ProfessionalProfile {
  user_id: string;
  display_name: string;
  rating_average?: number;
  completed_jobs_count: number;
  verification_status: string;
  is_available: boolean;
}

export interface Verification {
  id: string;
  verification_type: string;
  status: string;
  verified_at?: string;
}

export interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Skill {
  id: string;
  service_category_id: string;
  service_id: string;
  skill_level: string;
  verified: boolean;
  category: ServiceCategory;
  service: Service;
}

export interface ServiceCatalogueItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  services?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    pricing_model: string;
    base_price?: number;
  }>;
}
