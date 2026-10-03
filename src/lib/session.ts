/**
 * Secure Session Management with Token Rotation
 * 
 * Implements:
 * - Automatic session refresh
 * - Token rotation on each request
 * - Session expiration and invalidation
 * - Secure cookie settings
 * - Device fingerprinting for session validation
 */

import { cookies } from "next/headers";
import crypto from "crypto";

export interface SessionConfig {
  // Token expiration time in seconds
  tokenExpiry: number;
  // Refresh token expiration in seconds
  refreshTokenExpiry: number;
  // Rotate token after this many seconds
  rotationInterval: number;
  // Maximum session age in seconds
  maxSessionAge: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  tokenExpiry: 3600, // 1 hour
  refreshTokenExpiry: 604800, // 7 days
  rotationInterval: 1800, // 30 minutes
  maxSessionAge: 2592000, // 30 days
};

export interface SessionMetadata {
  userId: string;
  role: string;
  deviceFingerprint: string;
  createdAt: number;
  lastRotated: number;
  ipAddress: string;
}

/**
 * Generate device fingerprint based on user agent and IP
 */
export async function generateDeviceFingerprint(
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const data = `${userAgent || "unknown"}:${ipAddress || "unknown"}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Create secure session metadata
 */
export async function createSessionMetadata(
  userId: string,
  role: string,
  userAgent?: string,
  ipAddress?: string
): Promise<SessionMetadata> {
  const deviceFingerprint = await generateDeviceFingerprint(userAgent, ipAddress);
  const now = Math.floor(Date.now() / 1000);

  return {
    userId,
    role,
    deviceFingerprint,
    createdAt: now,
    lastRotated: now,
    ipAddress: ipAddress || "unknown",
  };
}

/**
 * Set secure session cookie with hardened settings
 */
export async function setSessionCookie(
  name: string,
  value: string,
  expirySeconds: number = DEFAULT_SESSION_CONFIG.tokenExpiry
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(name, value, {
    httpOnly: true, // Not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: expirySeconds, // Browser will auto-delete after expiry
    path: "/", // Available site-wide
  });
}

/**
 * Set secure metadata cookie
 */
export async function setSessionMetadataCookie(
  metadata: SessionMetadata
): Promise<void> {
  const cookieStore = await cookies();
  const metadataJson = JSON.stringify(metadata);

  cookieStore.set("sb-session-metadata", metadataJson, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: DEFAULT_SESSION_CONFIG.maxSessionAge,
    path: "/",
  });
}

/**
 * Get session metadata from cookie
 */
export async function getSessionMetadata(): Promise<SessionMetadata | null> {
  try {
    const cookieStore = await cookies();
    const metadata = cookieStore.get("sb-session-metadata")?.value;

    if (!metadata) {
      return null;
    }

    return JSON.parse(metadata) as SessionMetadata;
  } catch (err) {
    console.error("[Session] Error reading metadata:", err);
    return null;
  }
}

/**
 * Validate session is not expired
 */
export function isSessionExpired(
  metadata: SessionMetadata,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const sessionAge = now - metadata.createdAt;

  return sessionAge > config.maxSessionAge;
}

/**
 * Check if token needs rotation
 */
export function shouldRotateToken(
  metadata: SessionMetadata,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeSinceRotation = now - metadata.lastRotated;

  return timeSinceRotation > config.rotationInterval;
}

/**
 * Validate device fingerprint hasn't changed
 */
export async function validateDeviceFingerprint(
  storedFingerprint: string,
  currentUserAgent?: string,
  currentIpAddress?: string
): Promise<boolean> {
  const currentFingerprint = await generateDeviceFingerprint(
    currentUserAgent,
    currentIpAddress
  );

  // Log fingerprint mismatch (potential security issue)
  if (currentFingerprint !== storedFingerprint) {
    console.warn(
      "[Session] Device fingerprint mismatch - possible session hijacking attempt"
    );
    return false;
  }

  return true;
}

/**
 * Clear all session cookies (logout)
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  const sessionCookies = [
    "sb-access-token",
    "sb-refresh-token",
    "sb-session-metadata",
  ];

  for (const cookieName of sessionCookies) {
    cookieStore.delete(cookieName);
  }
}

/**
 * Check if session needs refresh
 */
export async function checkSessionNeedsRefresh(): Promise<{
  needsRefresh: boolean;
  shouldRotateToken: boolean;
  isExpired: boolean;
}> {
  const metadata = await getSessionMetadata();

  if (!metadata) {
    return {
      needsRefresh: true,
      shouldRotateToken: false,
      isExpired: true,
    };
  }

  const isExpired = isSessionExpired(metadata);
  const shouldRotate = shouldRotateToken(metadata);

  return {
    needsRefresh: isExpired || shouldRotate,
    shouldRotateToken: shouldRotate && !isExpired,
    isExpired,
  };
}

/**
 * Invalidate session (e.g., on logout or security event)
 */
export async function invalidateSession(): Promise<void> {
  await clearSessionCookies();

  // Could also add to a token blacklist in Redis or database
  // for immediate invalidation across all servers
  console.log("[Session] Session invalidated");
}

/**
 * Refresh session tokens with rotation
 */
export async function refreshSessionTokens(
  newAccessToken: string,
  newRefreshToken: string,
  userId: string,
  role: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  // Set new access token
  await setSessionCookie(
    "sb-access-token",
    newAccessToken,
    DEFAULT_SESSION_CONFIG.tokenExpiry
  );

  // Set new refresh token
  await setSessionCookie(
    "sb-refresh-token",
    newRefreshToken,
    DEFAULT_SESSION_CONFIG.refreshTokenExpiry
  );

  // Update metadata with new rotation timestamp
  const metadata = await createSessionMetadata(userId, role, userAgent, ipAddress);
  await setSessionMetadataCookie(metadata);

  console.log(`[Session] Session refreshed for user: ${userId}`);
}

/**
 * Get session info for debugging/monitoring
 */
export async function getSessionInfo(): Promise<{
  isActive: boolean;
  userId?: string;
  role?: string;
  sessionAge?: number;
  timeSinceRotation?: number;
  needsRefresh?: boolean;
} | null> {
  const metadata = await getSessionMetadata();

  if (!metadata) {
    return {
      isActive: false,
    };
  }

  const now = Math.floor(Date.now() / 1000);

  return {
    isActive: !isSessionExpired(metadata),
    userId: metadata.userId,
    role: metadata.role,
    sessionAge: now - metadata.createdAt,
    timeSinceRotation: now - metadata.lastRotated,
    needsRefresh:
      isSessionExpired(metadata) || shouldRotateToken(metadata),
  };
}

/**
 * Secure cookie options for next-auth or similar
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/**
 * Create CSP-safe token for CSRF protection
 */
export async function generateCsrfToken(): Promise<string> {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(
  storedToken: string,
  providedToken: string
): boolean {
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(providedToken)
  );
}
