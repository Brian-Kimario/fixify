/**
 * src/lib/notifications/types.ts
 *
 * Re-exports notification types from the canonical src/types/index.ts so
 * imports within the notifications library stay clean and relative.
 *
 * Consumers outside this library should import from "@/types" directly.
 */

export type {
  NotificationType,
  NotificationChannel,
  NotificationPreferences,
  NotificationLog,
  NotificationResult,
} from "@/types";
