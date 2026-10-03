import type { UserRole } from "@/types/auth";

/**
 * Get redirect path based on user role
 * This is a client-side utility function (not a Server Action)
 */
export function getRedirectPathByRole(role: UserRole | null) {
  if (!role) return "/customer";

  switch (role) {
    case "professional":
      return "/professional";
    case "admin":
      return "/admin";
    case "support":
      return "/admin";
    case "customer":
    default:
      return "/customer";
  }
}
