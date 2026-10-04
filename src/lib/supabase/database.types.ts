// AUTO-GENERATED — do not edit manually.
// Regenerate with: pnpm supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
// or via the Kiro MCP tool: generate_typescript_types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          access_notes: string | null
          address_line_1: string
          address_line_2: string | null
          area: string | null
          city: string
          created_at: string | null
          customer_id: string
          id: string
          label: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          state_region: string | null
          updated_at: string | null
        }
        Insert: {
          access_notes?: string | null
          address_line_1: string
          address_line_2?: string | null
          area?: string | null
          city: string
          created_at?: string | null
          customer_id: string
          id?: string
          label: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state_region?: string | null
          updated_at?: string | null
        }
        Update: {
          access_notes?: string | null
          address_line_1?: string
          address_line_2?: string | null
          area?: string | null
          city?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          label?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state_region?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          created_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_reference: string
          booking_status: string
          created_at: string | null
          customer_id: string
          id: string
          pricing_model: string
          professional_id: string | null
          property_id: string
          quoted_or_base_amount: number | null
          scheduled_end: string | null
          scheduled_start: string
          service_id: string
          service_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_reference: string
          booking_status?: string
          created_at?: string | null
          customer_id: string
          id?: string
          pricing_model: string
          professional_id?: string | null
          property_id: string
          quoted_or_base_amount?: number | null
          scheduled_end?: string | null
          scheduled_start: string
          service_id: string
          service_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_reference?: string
          booking_status?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          pricing_model?: string
          professional_id?: string | null
          property_id?: string
          quoted_or_base_amount?: number | null
          scheduled_end?: string | null
          scheduled_start?: string
          service_id?: string
          service_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          created_at: string | null
          findings: string
          id: string
          job_id: string
          professional_id: string
          recommendation: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          findings: string
          id?: string
          job_id: string
          professional_id: string
          recommendation?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          findings?: string
          id?: string
          job_id?: string
          professional_id?: string
          recommendation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_events: {
        Row: {
          actor_user_id: string
          created_at: string | null
          event_type: string
          from_state: string
          id: string
          job_id: string
          metadata: Json | null
          to_state: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string | null
          event_type: string
          from_state: string
          id?: string
          job_id: string
          metadata?: Json | null
          to_state: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string | null
          event_type?: string
          from_state?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          booking_id: string
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string | null
          current_state: string
          customer_id: string
          id: string
          on_the_way_at: string | null
          professional_id: string
          property_id: string
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          booking_id: string
          cancelled_at?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_state?: string
          customer_id: string
          id?: string
          on_the_way_at?: string | null
          professional_id: string
          property_id: string
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          booking_id?: string
          cancelled_at?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_state?: string
          customer_id?: string
          id?: string
          on_the_way_at?: string | null
          professional_id?: string
          property_id?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          specification: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specification?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specification?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string
          customer_id: string
          id: string
          job_id: string | null
          paid_at: string | null
          payment_type: string
          provider: string
          provider_reference: string
          quote_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          customer_id: string
          id?: string
          job_id?: string | null
          paid_at?: string | null
          payment_type: string
          provider: string
          provider_reference: string
          quote_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          customer_id?: string
          id?: string
          job_id?: string | null
          paid_at?: string | null
          payment_type?: string
          provider?: string
          provider_reference?: string
          quote_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          professional_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          professional_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          professional_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          bio: string | null
          completed_jobs_count: number | null
          created_at: string | null
          display_name: string
          is_available: boolean | null
          rating_average: number | null
          updated_at: string | null
          user_id: string
          verification_status: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          completed_jobs_count?: number | null
          created_at?: string | null
          display_name: string
          is_available?: boolean | null
          rating_average?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          completed_jobs_count?: number | null
          created_at?: string | null
          display_name?: string
          is_available?: boolean | null
          rating_average?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_service_areas: {
        Row: {
          area: string | null
          city: string
          created_at: string | null
          id: string
          is_active: boolean | null
          professional_id: string
          radius_km: number | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          professional_id: string
          radius_km?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          professional_id?: string
          radius_km?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_areas_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_skills: {
        Row: {
          created_at: string | null
          id: string
          professional_id: string
          service_category_id: string
          service_id: string | null
          skill_level: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          professional_id: string
          service_category_id: string
          service_id?: string | null
          skill_level?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          professional_id?: string
          service_category_id?: string
          service_id?: string | null
          skill_level?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_skills_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_skills_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_skills_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_verification_documents: {
        Row: {
          document_type: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          storage_path: string
          uploaded_at: string | null
          verification_id: string
        }
        Insert: {
          document_type: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          storage_path: string
          uploaded_at?: string | null
          verification_id: string
        }
        Update: {
          document_type?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          storage_path?: string
          uploaded_at?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_verification_documents_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "professional_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_verifications: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          professional_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          professional_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          professional_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_verifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_id: string
          created_at: string | null
          id: string
          name: string
          notes: string | null
          owner_customer_id: string
          property_type: string
          updated_at: string | null
        }
        Insert: {
          address_id: string
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_customer_id: string
          property_type: string
          updated_at?: string | null
        }
        Update: {
          address_id?: string
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_customer_id?: string
          property_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_customer_id_fkey"
            columns: ["owner_customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assets: {
        Row: {
          brand: string | null
          category: string
          created_at: string | null
          id: string
          installed_at: string | null
          model: string | null
          name: string
          notes: string | null
          property_id: string
          serial_number: string | null
          updated_at: string | null
          warranty_expires_at: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string | null
          id?: string
          installed_at?: string | null
          model?: string | null
          name: string
          notes?: string | null
          property_id: string
          serial_number?: string | null
          updated_at?: string | null
          warranty_expires_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string | null
          id?: string
          installed_at?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          property_id?: string
          serial_number?: string | null
          updated_at?: string | null
          warranty_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          item_type: string
          line_total: number
          material_id: string | null
          quantity: number
          quote_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          item_type: string
          line_total: number
          material_id?: string | null
          quantity: number
          quote_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          item_type?: string
          line_total?: number
          material_id?: string | null
          quantity?: number
          quote_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          discount: number | null
          expires_at: string | null
          id: string
          job_id: string
          professional_id: string
          reason: string
          status: string
          subtotal: number
          taxes_or_fees: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          job_id: string
          professional_id: string
          reason: string
          status?: string
          subtotal: number
          taxes_or_fees?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          job_id?: string
          professional_id?: string
          reason?: string
          status?: string
          subtotal?: number
          taxes_or_fees?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_key: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_materials: {
        Row: {
          created_at: string | null
          is_customer_selectable: boolean | null
          is_professional_selectable: boolean | null
          material_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          is_customer_selectable?: boolean | null
          is_professional_selectable?: boolean | null
          material_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          is_customer_selectable?: boolean | null
          is_professional_selectable?: boolean | null
          material_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_materials_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_option_values: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          price_modifier: number | null
          service_option_id: string
          sort_order: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          price_modifier?: number | null
          service_option_id: string
          sort_order?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          price_modifier?: number | null
          service_option_id?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_option_values_service_option_id_fkey"
            columns: ["service_option_id"]
            isOneToOne: false
            referencedRelation: "service_options"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          name: string
          option_type: string
          service_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          option_type: string
          service_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          option_type?: string
          service_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_options_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          classification_confidence: string | null
          created_at: string | null
          customer_id: string
          id: string
          input_text: string | null
          intake_source: string | null
          normalized_summary: string | null
          property_id: string
          status: string | null
          suggested_category_id: string | null
          suggested_service_id: string | null
          updated_at: string | null
        }
        Insert: {
          classification_confidence?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          input_text?: string | null
          intake_source?: string | null
          normalized_summary?: string | null
          property_id: string
          status?: string | null
          suggested_category_id?: string | null
          suggested_service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          classification_confidence?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          input_text?: string | null
          intake_source?: string | null
          normalized_summary?: string | null
          property_id?: string
          status?: string | null
          suggested_category_id?: string | null
          suggested_service_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category_id: string
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          inspection_fee: number | null
          is_active: boolean | null
          name: string
          pricing_model: string
          requires_inspection: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category_id: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          inspection_fee?: number | null
          is_active?: boolean | null
          name: string
          pricing_model: string
          requires_inspection?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          inspection_fee?: number | null
          is_active?: boolean | null
          name?: string
          pricing_model?: string
          requires_inspection?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      transition_job_state: {
        Args: {
          p_actor_user_id: string
          p_job_id: string
          p_metadata?: Json
          p_new_state: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "customer" | "professional" | "admin" | "support"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["customer", "professional", "admin", "support"],
    },
  },
} as const
