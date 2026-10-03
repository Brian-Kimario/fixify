import type { UserRole } from "@/types/auth";

/**
 * Validate and resolve the next parameter for role-based redirect
 * 
 * Ensures that the `next` parameter is:
 * 1. Safe (starts with / and not //)
 * 2. Matches the user's role
 * 3. Falls back to the base redirect if invalid
 * 
 * @param next - The requested redirect path from URL params
 * @param role - The user's role
 * @param baseRedirectPath - The default redirect for the role
 * @returns The safe redirect path
 * 
 * Role-based path validation:
 * - customer → /customer/*
 * - professional → /professional/*
 * - admin → /admin/*
 * - support → /support/*
 */
export function validateNextParam(
  next: string | null | undefined,
  role: UserRole | null,
  baseRedirectPath: string
): string {
  // If next is not provided, use base redirect
  if (!next) return baseRedirectPath;

  // Check if next is a safe internal redirect (must start with / and not //)
  if (!next.startsWith("/") || next.startsWith("//")) {
    return baseRedirectPath;
  }

  // Validate that next matches the user's role
  if (role === "customer" && next.startsWith("/customer")) {
    return next;
  } else if (role === "professional" && next.startsWith("/professional")) {
    return next;
  } else if (role === "admin" && next.startsWith("/admin")) {
    return next;
  } else if (role === "support" && next.startsWith("/support")) {
    return next;
  }

  // If next doesn't match role, fall back to base redirect
  return baseRedirectPath;
}
