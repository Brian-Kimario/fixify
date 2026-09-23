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
  created_at: string;
  updated_at: string;
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
