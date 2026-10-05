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
 * 
 * Cache: 1 minute (volatile data — token regenerates frequently)
 */
export async function GET(request: NextRequest) {
  const response = await handleCSRFTokenRequest();
  
  // Cache CSRF tokens for 1 minute — volatile but predictable per session
  response.headers.set("Cache-Control", "max-age=60, s-maxage=60");
  
  return response;
}
