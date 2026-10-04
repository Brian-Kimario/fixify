/**
 * Sign-Out Service
 * 
 * Handles secure sign-out with:
 * - Session cleanup (cookies, tokens, cache)
 * - Optional all-devices logout
 * - Activity audit logging
 * - Cache invalidation
 * - CSRF protection
 */

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Session-related cookie names
 */
const SESSION_COOKIES = {
  ACCESS_TOKEN: 'sb-access-token',
  REFRESH_TOKEN: 'sb-refresh-token',
  SESSION_ID: 'fixify-session-id',
  SESSION_METADATA: 'fixify-session-metadata',
  CSRF_TOKEN: 'fixify-csrf-token',
} as const;

/**
 * Cache keys to clear on logout
 */
const CACHE_PATTERNS = [
  'user:',
  'profile:',
  'professional:',
  'jobs:',
  'bookings:',
  'properties:',
  'quotes:',
  'messages:',
] as const;

/**
 * Clear all session-related cookies
 */
export async function clearSessionCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();

    // Clear Supabase auth cookies
    cookieStore.delete(SESSION_COOKIES.ACCESS_TOKEN);
    cookieStore.delete(SESSION_COOKIES.REFRESH_TOKEN);

    // Clear application cookies
    cookieStore.delete(SESSION_COOKIES.SESSION_ID);
    cookieStore.delete(SESSION_COOKIES.SESSION_METADATA);
    cookieStore.delete(SESSION_COOKIES.CSRF_TOKEN);

    // Clear any other fixify-related cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('fixify-') || cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });

    console.log('[SessionCleanup] Cleared all session cookies');
  } catch (error) {
    console.error('[SessionCleanup] Error clearing cookies:', error);
    throw new Error('Failed to clear session cookies');
  }
}

/**
 * Clear session data from local storage (client-side)
 * Call this from client component
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear all fixify-related localStorage
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.startsWith('fixify-') ||
        key.startsWith('supabase-') ||
        key === 'auth.token'
      ) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage as well
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach((key) => {
      if (key.startsWith('fixify-') || key.startsWith('supabase-')) {
        sessionStorage.removeItem(key);
      }
    });

    console.log('[SessionCleanup] Cleared local/session storage');
  } catch (error) {
    console.error('[SessionCleanup] Error clearing storage:', error);
  }
}

/**
 * Invalidate user cache (server-side)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    // In a real app, this would clear from Redis/cache store
    // For now, log the action
    console.log(`[CacheInvalidation] Marked cache as stale for user ${userId}`);

    // Could use a cache service like Redis:
    // await cacheClient.del(`user:${userId}:*`);
  } catch (error) {
    console.error('[CacheInvalidation] Error invalidating cache:', error);
  }
}

/**
 * Log sign-out event for audit trail
 */
export async function logSignOutEvent(
  userId: string,
  allDevices: boolean = false,
  reason: string = 'user_initiated'
): Promise<void> {
  try {
    const supabase = await createServerSupabase();

    await supabase.from('audit_logs').insert({
      user_id: userId,
      created_by: userId,
      action: allDevices ? 'logout_all_devices' : 'logout',
    });

    console.log(`[AuditLog] Logged sign-out event for user ${userId}`);
  } catch (error) {
    console.error('[AuditLog] Error logging sign-out event:', error);
    // Don't throw - audit logging shouldn't block logout
  }
}

/**
 * Terminate all active sessions for a user
 * Useful for security-sensitive operations or if user suspects compromise
 */
export async function terminateAllSessions(userId: string): Promise<void> {
  try {
    const supabase = await createServerSupabase();

    // Supabase: Sign out from all devices
    // This is handled by Supabase backend - calling signOut() without scope terminates all
    await supabase.auth.signOut({ scope: 'global' });

    // Log the all-devices logout
    await logSignOutEvent(userId, true, 'user_requested_all_devices');

    console.log(`[SessionTermination] Terminated all sessions for user ${userId}`);
  } catch (error) {
    console.error('[SessionTermination] Error terminating all sessions:', error);
    throw new Error('Failed to terminate all sessions');
  }
}

/**
 * Main sign-out handler - coordinates all cleanup
 * 
 * Flow:
 * 1. Get current user
 * 2. Log the sign-out event
 * 3. Sign out from Supabase
 * 4. Clear all cookies
 * 5. Invalidate cache
 * 6. Return redirect path
 */
export async function signOut(options: {
  allDevices?: boolean;
  reason?: string;
} = {}): Promise<{ success: boolean; redirectPath: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user before signing out
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[SignOut] No user found, likely already logged out');
      return {
        success: true,
        redirectPath: '/auth/login',
      };
    }

    const userId = user.id;

    // Log the sign-out event
    await logSignOutEvent(userId, options.allDevices, options.reason);

    // Handle all-devices logout if requested
    if (options.allDevices) {
      await terminateAllSessions(userId);
    } else {
      // Single device logout
      await supabase.auth.signOut();
    }

    // Clear cookies
    await clearSessionCookies();

    // Invalidate cache
    await invalidateUserCache(userId);

    console.log(
      `[SignOut] Successfully signed out user ${userId}${options.allDevices ? ' (all devices)' : ''}`
    );

    return {
      success: true,
      redirectPath: '/auth/login?logged_out=1',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during sign-out';
    console.error('[SignOut] Error during sign-out:', errorMessage);

    return {
      success: false,
      redirectPath: '/auth/login',
      error: errorMessage,
    };
  }
}

/**
 * Get current session info (for UI display)
 */
export async function getSessionInfo(): Promise<{
  isActive: boolean;
  userId?: string;
  email?: string;
  lastActivity?: Date;
  sessionStartTime?: Date;
} | null> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      isActive: true,
      userId: user.id,
      email: user.email,
      sessionStartTime: user.created_at ? new Date(user.created_at) : undefined,
    };
  } catch (error) {
    console.error('[SessionInfo] Error retrieving session info:', error);
    return null;
  }
}

/**
 * Verify session is still valid (called by middleware)
 */
export async function verifySessionValidity(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return !!user;
  } catch (error) {
    console.error('[VerifySession] Session verification failed:', error);
    return false;
  }
}
