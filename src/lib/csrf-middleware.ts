/**
 * CSRF Middleware for API Routes
 * 
 * Use this middleware on state-changing API endpoints (POST, PUT, PATCH, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateCSRFRequestFull, getCSRFTokenForClient } from "./csrf";
import { logSuspiciousActivity } from "./audit";

export interface CSRFMiddlewareOptions {
  allowedOrigins?: string[];
  excludeSafeMethods?: boolean;
  logFailures?: boolean;
}

/**
 * CSRF validation middleware for API routes
 */
export async function csrfMiddleware(
  request: NextRequest,
  options: CSRFMiddlewareOptions = {}
): Promise<{
  valid: boolean;
  response?: NextResponse;
  csrfToken?: string;
}> {
  try {
    const {
      allowedOrigins = [],
      excludeSafeMethods = true,
      logFailures = true,
    } = options;

    // Get request details
    const method = request.method;
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const csrfToken = request.headers.get("x-csrf-token");
    const userAgent = request.headers.get("user-agent");

    // Get client IP for logging
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validate CSRF
    const validation = await validateCSRFRequestFull(
      method,
      origin,
      referer,
      csrfToken,
      allowedOrigins
    );

    if (!validation.valid) {
      if (logFailures) {
        // Log suspicious activity
        await logSuspiciousActivity(
          null, // Unknown user at this point
          "csrf_validation_failed",
          {
            method,
            origin,
            referer,
            ip,
            errors: validation.errors,
          },
          ip
        );
      }

      const response = NextResponse.json(
        {
          error: "CSRF validation failed",
          details: validation.errors,
        },
        { status: 403 }
      );

      return {
        valid: false,
        response,
      };
    }

    // Get fresh CSRF token for next request
    const newCsrfToken = await getCSRFTokenForClient();

    return {
      valid: true,
      csrfToken: newCsrfToken || undefined,
    };
  } catch (err) {
    console.error("[CSRF Middleware] Error:", err);

    const response = NextResponse.json(
      {
        error: "CSRF validation error",
      },
      { status: 500 }
    );

    return {
      valid: false,
      response,
    };
  }
}

/**
 * Wrap API handler with CSRF protection
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CSRFMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only validate state-changing methods
    if (
      !["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
    ) {
      return handler(request);
    }

    // Validate CSRF
    const validation = await csrfMiddleware(request, options);

    if (!validation.valid) {
      return validation.response || NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    // Call the actual handler
    const response = await handler(request);

    // Add new CSRF token to response headers if available
    if (validation.csrfToken) {
      response.headers.set("x-csrf-token", validation.csrfToken);
    }

    return response;
  };
}

/**
 * CSRF token endpoint - GET /api/csrf-token
 * Clients should call this to get an initial CSRF token
 */
export async function handleCSRFTokenRequest(): Promise<NextResponse> {
  try {
    const token = await getCSRFTokenForClient();

    if (!token) {
      return NextResponse.json(
        { error: "Failed to generate CSRF token" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        token,
      },
      {
        headers: {
          "x-csrf-token": token,
        },
      }
    );
  } catch (err) {
    console.error("[CSRF Token] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
