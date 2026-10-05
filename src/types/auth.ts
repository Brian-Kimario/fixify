/**
 * Authentication and Authorization Types
 */

export type UserRole = 'customer' | 'professional' | 'admin' | 'support';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  whatsapp_number?: string | null;
  notification_preferences?: {
    email_notifications?: boolean;
    marketing_emails?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    whatsapp_enabled?: boolean;
    sms_enabled?: boolean;
    do_not_disturb_start?: string;
    do_not_disturb_end?: string;
    data_collection?: boolean;
    data_sharing?: boolean;
    profile_visibility?: boolean;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}
