/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements:
 * - Double Submit Cookie Pattern
 * - CSRF token generation and validation
 * - SameSite cookie attribute enforcement
 * - Origin/Referer header validation
 * - Secure token storage and rotation
 */

import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_AGE = 3600; // 1 hour

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token in cookie
 */
export async function setCSRFCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true, // Not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: CSRF_COOKIE_AGE,
    path: "/",
  });
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
  } catch (err) {
    console.error("[CSRF] Error getting token:", err);
    return null;
  }
}

/**
 * Validate CSRF token (timing-safe comparison)
 */
export function validateCSRFToken(
  storedToken: string,
  providedToken: string
): boolean {
  try {
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(providedToken)
    );
  } catch (err) {
    // Comparison failed (different lengths)
    return false;
  }
}

/**
 * Validate CSRF token from request headers
 */
export async function validateCSRFRequest(
  providedToken?: string | null
): Promise<{ valid: boolean; error?: string }> {
  try {
    const storedToken = await getCSRFToken();

    if (!storedToken) {
      return {
        valid: false,
        error: "CSRF token not found in cookies",
      };
    }

    if (!providedToken) {
      return {
        valid: false,
        error: "CSRF token not provided in request",
      };
    }

    if (!validateCSRFToken(storedToken, providedToken)) {
      return {
        valid: false,
        error: "CSRF token validation failed",
      };
    }

    return { valid: true };
  } catch (err) {
    console.error("[CSRF] Validation error:", err);
    return {
      valid: false,
      error: "CSRF validation error",
    };
  }
}

/**
 * Validate origin header to prevent CSRF attacks
 */
export function validateOriginHeader(
  requestOrigin: string | null,
  allowedOrigins: string[] = []
): boolean {
  if (!requestOrigin) {
    // If no origin header, it might be a same-origin request (acceptable)
    return true;
  }

  // Add default allowed origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const defaultAllowed = [appUrl, "http://localhost:3000", "http://localhost:3001"];

  const allowed = [...defaultAllowed, ...allowedOrigins];

  try {
    const origin = new URL(requestOrigin).origin;
    const isAllowed = allowed.some((a) => {
      const allowedOrigin = new URL(a).origin;
      return origin === allowedOrigin;
    });

    if (!isAllowed) {
      console.warn(`[CSRF] Suspicious origin detected: ${origin}`);
    }

    return isAllowed;
  } catch (err) {
    console.error("[CSRF] Invalid origin format:", err);
    return false;
  }
}

/**
 * Validate Referer header
 */
export function validateRefererHeader(
  referer: string | null,
  allowedOrigins: string[] = []
): boolean {
  if (!referer) {
    // Referer might be missing due to privacy settings, but be cautious
    return true;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const defaultAllowed = [appUrl, "http://localhost:3000", "http://localhost:3001"];

  const allowed = [...defaultAllowed, ...allowedOrigins];

  try {
    const refererOrigin = new URL(referer).origin;
    const isAllowed = allowed.some((a) => {
      const allowedOrigin = new URL(a).origin;
      return refererOrigin === allowedOrigin;
    });

    if (!isAllowed) {
      console.warn(`[CSRF] Suspicious referer detected: ${refererOrigin}`);
    }

    return isAllowed;
  } catch (err) {
    console.error("[CSRF] Invalid referer format:", err);
    return false;
  }
}

/**
 * Security headers for CSRF and other protections
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME sniffing
  "X-Content-Type-Options": "nosniff",

  // XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",

  // Content Security Policy (strict for admin)
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",

  // HSTS (HTTPS Strict Transport Security)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Admin-specific strict CSP
 */
export const ADMIN_CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Record<string, string>): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers[key] = value;
  });
}

/**
 * Apply admin-specific security headers
 */
export function applyAdminSecurityHeaders(headers: Record<string, string>): void {
  applySecurityHeaders(headers);
  headers["Content-Security-Policy"] = ADMIN_CSP;
}

/**
 * Check if request is safe from CSRF
 * (Only applies to state-changing methods)
 */
export function isSafeFromCSRF(method: string): boolean {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  return safeMethods.includes(method.toUpperCase());
}

/**
 * Comprehensive CSRF validation middleware
 */
export async function validateCSRFRequestFull(
  method: string,
  requestOrigin: string | null,
  referer: string | null,
  providedToken?: string | null,
  allowedOrigins: string[] = []
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Safe methods don't need CSRF validation
    if (isSafeFromCSRF(method)) {
      return { valid: true, errors: [] };
    }

    // Validate origin
    if (!validateOriginHeader(requestOrigin, allowedOrigins)) {
      errors.push("Invalid origin header");
    }

    // Validate referer
    if (!validateRefererHeader(referer, allowedOrigins)) {
      errors.push("Invalid referer header");
    }

    // Validate CSRF token
    const csrfValidation = await validateCSRFRequest(providedToken);
    if (!csrfValidation.valid) {
      errors.push(csrfValidation.error || "CSRF token validation failed");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (err) {
    console.error("[CSRF] Validation error:", err);
    return {
      valid: false,
      errors: ["CSRF validation error"],
    };
  }
}

/**
 * Rotate CSRF token (on each request for extra security)
 */
export async function rotateCSRFToken(): Promise<string> {
  const newToken = generateCsrfToken();
  await setCSRFCookie(newToken);
  return newToken;
}

/**
 * Get CSRF token for API response (send to client safely)
 */
export async function getCSRFTokenForClient(): Promise<string | null> {
  try {
    let token = await getCSRFToken();

    // If no token exists, generate one
    if (!token) {
      token = generateCsrfToken();
      await setCSRFCookie(token);
    }

    return token;
  } catch (err) {
    console.error("[CSRF] Error getting token for client:", err);
    return null;
  }
}
