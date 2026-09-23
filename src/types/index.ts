/**
 * TypeScript type definitions and interfaces
 * Centralized types for the application
 */

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "property_manager" | "professional" | "admin";
  created_at: string;
  updated_at: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Bid Types
export interface Bid {
  id: string;
  job_id: string;
  professional_id: string;
  amount: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
}
