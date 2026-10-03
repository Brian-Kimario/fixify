import { NextRequest, NextResponse } from "next/server";
import { handleCSRFTokenRequest } from "@/lib/csrf-middleware";

/**
 * GET /api/csrf-token
 * Returns a new CSRF token for client-side use
 * 
 * Usage in React:
 * const res = await fetch('/api/csrf-token');
 * const { token } = await res.json();
 * // Use token in X-CSRF-Token header for state-changing requests
 */
export async function GET(request: NextRequest) {
  return handleCSRFTokenRequest();
}
