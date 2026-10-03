/**
 * Cache Management and Invalidation Strategy
 * 
 * Prevents:
 * - Stale data from being served to users
 * - Cache poisoning attacks
 * - Mixed user data in cache (user A seeing user B's data)
 * - Privilege escalation through cached permissions
 * 
 * Implements:
 * - Hierarchical cache invalidation
 * - User-scoped cache keys
 * - Time-based cache expiration
 * - Event-based cache busting
 * - Cache versioning
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: number;
  userId?: string; // For user-scoped cache
  scope?: string; // "user", "admin", "public"
}

export interface CacheConfig {
  globalVersion: number;
  userVersion: Map<string, number>;
}

// In-memory cache (for production, use Redis)
const cache = new Map<string, CacheEntry<any>>();
const cacheConfig: CacheConfig = {
  globalVersion: 1,
  userVersion: new Map(),
};

// Default cache TTLs (in milliseconds)
export const CACHE_TTLS = {
  user: 5 * 60 * 1000, // 5 minutes for user data
  admin: 10 * 60 * 1000, // 10 minutes for admin dashboards
  profiles: 15 * 60 * 1000, // 15 minutes for profile data
  permissions: 2 * 60 * 1000, // 2 minutes for permissions (strict)
  bookings: 3 * 60 * 1000, // 3 minutes for bookings
  jobs: 3 * 60 * 1000, // 3 minutes for jobs
  payments: 5 * 60 * 1000, // 5 minutes for payments (financial data)
  auditLogs: 1 * 60 * 1000, // 1 minute for audit logs (must be fresh)
};

/**
 * Generate cache key with versioning
 */
export function generateCacheKey(
  baseKey: string,
  userId?: string,
  scope: "user" | "admin" | "public" = "public"
): string {
  const globalVersion = cacheConfig.globalVersion;
  const userVersion = userId ? cacheConfig.userVersion.get(userId) || 1 : "global";

  return `${scope}:${baseKey}:${userVersion}:${globalVersion}`;
}

/**
 * Get cached data
 */
export function getCachedData<T>(
  key: string,
  userId?: string,
  scope: "user" | "admin" | "public" = "public"
): T | null {
  try {
    const cacheKey = generateCacheKey(key, userId, scope);
    const entry = cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      cache.delete(cacheKey);
      return null;
    }

    // Verify scope matches
    if (entry.scope !== scope) {
      return null;
    }

    // For user-scoped cache, verify userId matches
    if (scope === "user" && entry.userId !== userId) {
      return null;
    }

    return entry.data as T;
  } catch (err) {
    console.error("[Cache] Error retrieving cached data:", err);
    return null;
  }
}

/**
 * Set cached data
 */
export function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTLS.user,
  userId?: string,
  scope: "user" | "admin" | "public" = "public"
): void {
  try {
    const cacheKey = generateCacheKey(key, userId, scope);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: cacheConfig.globalVersion,
      userId,
      scope,
    };

    cache.set(cacheKey, entry);
  } catch (err) {
    console.error("[Cache] Error setting cached data:", err);
  }
}

/**
 * Invalidate cache for a specific key
 */
export function invalidateCacheKey(key: string): void {
  try {
    // Find and delete all versions of this key
    const keysToDelete = Array.from(cache.keys()).filter((k) =>
      k.includes(`:${key}:`)
    );

    keysToDelete.forEach((k) => cache.delete(k));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Invalidated ${keysToDelete.length} cache entries for key: ${key}`);
    }
  } catch (err) {
    console.error("[Cache] Error invalidating cache key:", err);
  }
}

/**
 * Invalidate all cache for a specific user
 */
export function invalidateUserCache(userId: string): void {
  try {
    // Increment user's version number to invalidate all their cached data
    const currentVersion = cacheConfig.userVersion.get(userId) || 1;
    cacheConfig.userVersion.set(userId, currentVersion + 1);

    console.log(
      `[Cache] Invalidated all cache for user: ${userId} (version: ${currentVersion + 1})`
    );
  } catch (err) {
    console.error("[Cache] Error invalidating user cache:", err);
  }
}

/**
 * Invalidate all cache for a scope
 */
export function invalidateScopeCache(scope: "user" | "admin" | "public"): void {
  try {
    // Find and delete all entries in this scope
    const keysToDelete = Array.from(cache.keys()).filter((k) =>
      k.startsWith(`${scope}:`)
    );

    keysToDelete.forEach((k) => cache.delete(k));

    console.log(`[Cache] Invalidated ${keysToDelete.length} cache entries in scope: ${scope}`);
  } catch (err) {
    console.error("[Cache] Error invalidating scope cache:", err);
  }
}

/**
 * Invalidate global cache (all users, all scopes)
 */
export function invalidateGlobalCache(): void {
  try {
    cache.clear();
    cacheConfig.globalVersion += 1;
    cacheConfig.userVersion.clear();

    console.log(`[Cache] Global cache invalidated (version: ${cacheConfig.globalVersion})`);
  } catch (err) {
    console.error("[Cache] Error invalidating global cache:", err);
  }
}

/**
 * Cache invalidation patterns for common operations
 */
export const cacheInvalidationPatterns = {
  // When user role changes, invalidate their permission cache
  userRoleChanged: (userId: string) => {
    invalidateCacheKey(`permissions:${userId}`);
    invalidateCacheKey(`permissions:list`);
    invalidateUserCache(userId);
  },

  // When user profile updates, invalidate their profile cache
  userProfileUpdated: (userId: string) => {
    invalidateCacheKey(`profile:${userId}`);
    invalidateUserCache(userId);
  },

  // When a booking is created/updated, invalidate related caches
  bookingChanged: (bookingId: string, customerId: string, professionalId: string) => {
    invalidateCacheKey(`booking:${bookingId}`);
    invalidateCacheKey(`bookings:list`);
    invalidateCacheKey(`bookings:customer:${customerId}`);
    invalidateCacheKey(`bookings:professional:${professionalId}`);
    invalidateUserCache(customerId);
    invalidateUserCache(professionalId);
  },

  // When a job is created/updated, invalidate related caches
  jobChanged: (jobId: string, customerId: string) => {
    invalidateCacheKey(`job:${jobId}`);
    invalidateCacheKey(`jobs:list`);
    invalidateCacheKey(`jobs:customer:${customerId}`);
    invalidateUserCache(customerId);
  },

  // When payment processed, invalidate payment caches
  paymentProcessed: (paymentId: string, userId: string) => {
    invalidateCacheKey(`payment:${paymentId}`);
    invalidateCacheKey(`payments:list`);
    invalidateCacheKey(`payments:user:${userId}`);
    invalidateUserCache(userId);
  },

  // Security event: invalidate permissions and session data
  securityEvent: () => {
    invalidateScopeCache("user");
    invalidateScopeCache("admin");
    invalidateCacheKey("permissions:*");
  },

  // Admin updates: invalidate admin dashboard caches
  adminDashboardRefresh: () => {
    invalidateScopeCache("admin");
  },
};

/**
 * Get cache statistics for monitoring
 */
export function getCacheStatistics(): {
  totalEntries: number;
  memoryUsage: number;
  globalVersion: number;
  userVersions: number;
} {
  try {
    let memoryUsage = 0;

    // Rough estimation of memory usage
    for (const [key, entry] of cache.entries()) {
      memoryUsage += key.length * 2; // Key size
      memoryUsage += JSON.stringify(entry.data).length; // Data size
    }

    return {
      totalEntries: cache.size,
      memoryUsage,
      globalVersion: cacheConfig.globalVersion,
      userVersions: cacheConfig.userVersion.size,
    };
  } catch (err) {
    console.error("[Cache] Error getting statistics:", err);
    return {
      totalEntries: 0,
      memoryUsage: 0,
      globalVersion: cacheConfig.globalVersion,
      userVersions: cacheConfig.userVersion.size,
    };
  }
}

/**
 * Clean up expired cache entries (run periodically)
 */
export function cleanupExpiredCacheEntries(): number {
  try {
    let deletedCount = 0;
    const now = Date.now();

    for (const [key, entry] of cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        cache.delete(key);
        deletedCount += 1;
      }
    }

    if (deletedCount > 0) {
      console.log(`[Cache] Cleaned up ${deletedCount} expired cache entries`);
    }

    return deletedCount;
  } catch (err) {
    console.error("[Cache] Error cleaning up cache:", err);
    return 0;
  }
}

/**
 * Set up periodic cache cleanup (every minute)
 */
export function startCacheCleanupInterval(): NodeJS.Timer {
  return setInterval(() => {
    cleanupExpiredCacheEntries();
  }, 60000); // Run every minute
}

/**
 * Cache-aware data fetcher with invalidation support
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTLS.user,
  userId?: string,
  scope: "user" | "admin" | "public" = "public"
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = getCachedData<T>(cacheKey, userId, scope);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch fresh data
    const data = await fetcher();

    // Store in cache
    setCachedData(cacheKey, data, ttl, userId, scope);

    return data;
  } catch (err) {
    console.error(`[Cache] Error fetching data for key: ${cacheKey}`, err);
    throw err;
  }
}

/**
 * Wrap Supabase queries with caching
 */
export async function cachedSupabaseQuery<T>(
  cacheKey: string,
  query: () => Promise<T>,
  ttl: number = CACHE_TTLS.user,
  userId?: string,
  scope: "user" | "admin" | "public" = "public"
): Promise<T> {
  return getCachedOrFetch(cacheKey, query, ttl, userId, scope);
}

/**
 * Utility: Create cache invalidation webhook handler
 */
export function createCacheInvalidationHandler(
  eventType: string,
  payload: Record<string, any>
): void {
  try {
    const { userId, bookingId, jobId, paymentId, professionalId, customerId } =
      payload;

    switch (eventType) {
      case "user.role_changed":
        if (userId) cacheInvalidationPatterns.userRoleChanged(userId);
        break;

      case "user.profile_updated":
        if (userId) cacheInvalidationPatterns.userProfileUpdated(userId);
        break;

      case "booking.changed":
        if (bookingId && customerId && professionalId) {
          cacheInvalidationPatterns.bookingChanged(bookingId, customerId, professionalId);
        }
        break;

      case "job.changed":
        if (jobId && customerId) {
          cacheInvalidationPatterns.jobChanged(jobId, customerId);
        }
        break;

      case "payment.processed":
        if (paymentId && userId) {
          cacheInvalidationPatterns.paymentProcessed(paymentId, userId);
        }
        break;

      case "security.event":
        cacheInvalidationPatterns.securityEvent();
        break;

      case "admin.refresh":
        cacheInvalidationPatterns.adminDashboardRefresh();
        break;

      default:
        console.warn(`[Cache] Unknown cache invalidation event: ${eventType}`);
    }
  } catch (err) {
    console.error("[Cache] Error handling cache invalidation:", err);
  }
}
