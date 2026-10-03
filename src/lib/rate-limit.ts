/**
 * Rate Limiting and Request Validation
 * 
 * Implements token bucket algorithm for rate limiting to prevent:
 * - Brute force attacks
 * - DDoS attacks
 * - Abuse of admin API endpoints
 * - Excessive database queries
 */

import { headers } from "next/headers";

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

// In-memory store (for production, use Redis)
const rateLimitStore: RateLimitStore = {};

/**
 * Get client identifier (IP address or user ID)
 */
async function getClientId(userId?: string): Promise<string> {
  if (userId) {
    return `user:${userId}`;
  }

  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";
    return `ip:${ip}`;
  } catch {
    return "unknown";
  }
}

/**
 * Token bucket rate limiter
 * @param clientId - Client identifier (user ID or IP)
 * @param maxTokens - Maximum tokens in bucket
 * @param refillRate - Tokens added per second
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  clientId: string,
  maxTokens: number = 100,
  refillRate: number = 10 // tokens per second
): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now() / 1000; // Convert to seconds
  let bucket = rateLimitStore[clientId];

  if (!bucket) {
    // Initialize new bucket
    bucket = {
      tokens: maxTokens,
      lastRefill: now,
    };
    rateLimitStore[clientId] = bucket;
  }

  // Calculate tokens to add based on time elapsed
  const timeElapsed = now - bucket.lastRefill;
  const tokensToAdd = timeElapsed * refillRate;

  // Refill bucket (capped at maxTokens)
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if request is allowed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetIn: Math.ceil(1 / refillRate),
    };
  }

  // Calculate reset time
  const tokensNeeded = 1 - bucket.tokens;
  const resetIn = Math.ceil(tokensNeeded / refillRate);

  return {
    allowed: false,
    remaining: 0,
    resetIn,
  };
}

/**
 * Request validation rules
 */
export interface ValidationRule {
  field: string;
  type: "string" | "number" | "boolean" | "email" | "uuid";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

/**
 * Validate request body against rules
 */
export function validateRequest(
  data: Record<string, any>,
  rules: ValidationRule[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors[rule.field] = `${rule.field} is required`;
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue; // Skip optional empty fields
    }

    // Type validation
    switch (rule.type) {
      case "string":
        if (typeof value !== "string") {
          errors[rule.field] = `${rule.field} must be a string`;
          break;
        }
        if (rule.minLength && value.length < rule.minLength) {
          errors[rule.field] = `${rule.field} must be at least ${rule.minLength} characters`;
          break;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[rule.field] = `${rule.field} must be at most ${rule.maxLength} characters`;
          break;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[rule.field] = `${rule.field} format is invalid`;
          break;
        }
        break;

      case "email":
        if (typeof value !== "string" || !isValidEmail(value)) {
          errors[rule.field] = `${rule.field} must be a valid email`;
        }
        break;

      case "uuid":
        if (typeof value !== "string" || !isValidUUID(value)) {
          errors[rule.field] = `${rule.field} must be a valid UUID`;
        }
        break;

      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          errors[rule.field] = `${rule.field} must be a number`;
          break;
        }
        if (rule.min !== undefined && value < rule.min) {
          errors[rule.field] = `${rule.field} must be at least ${rule.min}`;
          break;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors[rule.field] = `${rule.field} must be at most ${rule.max}`;
          break;
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors[rule.field] = `${rule.field} must be a boolean`;
        }
        break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * UUID validation (v4)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove angle brackets to prevent HTML injection
    .trim();
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMIT_PRESETS = {
  // General API endpoints
  api: {
    maxTokens: 100,
    refillRate: 10, // 10 requests per second
  },
  // Admin endpoints (stricter)
  admin: {
    maxTokens: 50,
    refillRate: 5, // 5 requests per second
  },
  // Authentication endpoints (very strict)
  auth: {
    maxTokens: 5,
    refillRate: 1, // 1 request per second
  },
  // Data export endpoints (strict to prevent data scraping)
  export: {
    maxTokens: 10,
    refillRate: 0.5, // 1 request per 2 seconds
  },
};

/**
 * Create a rate limit middleware response
 */
export function createRateLimitResponse(
  remaining: number,
  resetIn: number
): { headers: Record<string, string>; status: number; body: string } {
  return {
    headers: {
      "Retry-After": String(resetIn),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + resetIn)),
    },
    status: 429,
    body: JSON.stringify({
      error: "Too many requests",
      retryAfter: resetIn,
      message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
    }),
  };
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string>
): { status: number; body: string } {
  return {
    status: 400,
    body: JSON.stringify({
      error: "Validation failed",
      details: errors,
    }),
  };
}

/**
 * Cleanup old entries from rate limit store (run periodically)
 */
export function cleanupRateLimitStore(maxAge: number = 3600000): void {
  const now = Date.now() / 1000;
  const maxAgeSeconds = maxAge / 1000;

  for (const [key, bucket] of Object.entries(rateLimitStore)) {
    if (now - bucket.lastRefill > maxAgeSeconds) {
      delete rateLimitStore[key];
    }
  }
}
