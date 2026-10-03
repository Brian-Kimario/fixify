-- MIGRATION 20261003_001: Notification Preferences
-- Phase 10 — India-Optimized Multi-Channel Notification System
-- Adds WhatsApp number and notification preferences to the profiles table.

-- ── WhatsApp number ───────────────────────────────────────────────────────────
-- Separate from `phone` — customers may have a different WhatsApp number,
-- and WhatsApp Business API requires E.164 format (+91XXXXXXXXXX).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- ── Notification preferences ──────────────────────────────────────────────────
-- JSONB stores per-channel opt-in flags and Do Not Disturb window (IST, 24-hr).
-- Defaults: WhatsApp on, SMS on, email on (required, cannot be disabled),
--           DND 19:00 – 09:00 IST (7 PM – 9 AM) per India market research.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
    "whatsapp_enabled": true,
    "sms_enabled": true,
    "email_enabled": true,
    "do_not_disturb_start": "19:00",
    "do_not_disturb_end": "09:00"
  }'::jsonb;

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Partial index for customers with a WhatsApp number (used by notification sender
-- to quickly find customers who can receive WhatsApp messages).
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_number
  ON public.profiles (whatsapp_number)
  WHERE whatsapp_number IS NOT NULL;

-- GIN index for fast JSONB key lookups in notification_preferences.
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences
  ON public.profiles USING GIN (notification_preferences);
