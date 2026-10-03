import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  validateRequest,
  createRateLimitResponse,
  createValidationErrorResponse,
  RATE_LIMIT_PRESETS,

  sanitizeInput,
} from "@/lib/rate-limit";
import { verifyAdminAccess, updateUserRole, logAdminAction } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role (admin only)
 * Validates input and prevents role escalation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Apply rate limiting (stricter for write operations)
    const clientId = user.id;
    const rateLimit = checkRateLimit(
      clientId,
      RATE_LIMIT_PRESETS.admin.maxTokens / 2,
      RATE_LIMIT_PRESETS.admin.refillRate / 2
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

    // Parse and validate request body
    const body = await request.json();

    const validation = validateRequest(body, [
      {
        field: "role",
        type: "string",
        required: true,
        pattern: /^(customer|professional|admin)$/,
      },
    ]);

    if (!validation.valid) {
      const response = createValidationErrorResponse(validation.errors);
      return NextResponse.json(
        JSON.parse(response.body),
        { status: response.status }
      );
    }

    // Validate target user ID is valid UUID
    const validation2 = validateRequest({ id: id }, [
      {
        field: "id",
        type: "uuid",
        required: true,
      },
    ]);

    if (!validation2.valid) {
      const response = createValidationErrorResponse(validation2.errors);
      return NextResponse.json(
        JSON.parse(response.body),
        { status: response.status }
      );
    }

    // Prevent self-modification
    if (id === user.id) {
      return NextResponse.json(
        {
          error: "Cannot modify your own role",
        },
        { status: 400 }
      );
    }

    // Update user role
    const result = await updateUserRole(
      id,
      body.role as "customer" | "professional" | "admin"
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log the action
    await logAdminAction(user.id, `user_role_updated`, {
      user_id: id,
      new_role: body.role,
      updated_by: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `User role updated to ${body.role}`,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (err) {
    console.error("[Admin API] Error updating user role:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
