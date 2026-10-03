import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  validateRequest,
  createRateLimitResponse,
  createValidationErrorResponse,
  RATE_LIMIT_PRESETS,

} from "@/lib/rate-limit";
import { verifyAdminAccess } from "@/lib/supabase/admin";

/**
 * GET /api/admin/users
 * Fetch all users (admin only)
 * Rate limited to 5 requests per second
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Apply rate limiting
    const clientId = user.id;
    const rateLimit = checkRateLimit(
      clientId,
      RATE_LIMIT_PRESETS.admin.maxTokens,
      RATE_LIMIT_PRESETS.admin.refillRate
    );

    if (!rateLimit.allowed) {
      const response = createRateLimitResponse(
        rateLimit.remaining,
        rateLimit.resetIn
      );
      return NextResponse.json(
        JSON.parse(response.body),
        {
          status: response.status,
          headers: response.headers,
        }
      );
    }

    // Get pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500); // Max 500

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Fetch users
    const { data: users, error, count } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, role, created_at, updated_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        data: users,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (err) {
    console.error("[Admin API] Error fetching users:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
