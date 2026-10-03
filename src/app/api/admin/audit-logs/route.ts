import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,

  createRateLimitResponse,
} from "@/lib/rate-limit";
import { verifyAdminAccess, getAuditLogs } from "@/lib/supabase/admin";
import { logAuditEvent, AuditAction } from "@/lib/audit";

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs (admin only)
 * Filters by date range and action
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
      // Log unauthorized attempt
      await logAuditEvent({
        user_id: user.id,
        action: AuditAction.UNAUTHORIZED_ACCESS,
        severity: "warning" as any,
        success: false,
      });

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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const action = url.searchParams.get("action");

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (action) {
      query = query.eq("action", action);
    }

    // Apply pagination
    const { data: logs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Log this admin action
    await logAuditEvent({
      user_id: user.id,
      action: AuditAction.ADMIN_VIEW_AUDIT_LOGS,
      severity: "info" as any,
      success: true,
      changes: {
        filters: { startDate, endDate, action },
      },
    });

    return NextResponse.json(
      {
        data: logs,
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
    console.error("[Admin API] Error fetching audit logs:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
