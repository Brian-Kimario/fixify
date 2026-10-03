'use client';

/**
 * src/components/customer/NotificationPreferences.tsx
 *
 * Customer-facing notification preference settings panel.
 *
 * Displays per-channel opt-in toggles and a Do Not Disturb time window.
 * Submits changes via the updateNotificationPreferences server action.
 *
 * Usage:
 *   <NotificationPreferences
 *     initialPrefs={profile.notification_preferences}
 *     whatsappNumber={profile.whatsapp_number}
 *   />
 */

import { useState, useTransition } from 'react';
import { SettingsSection } from './SettingsSection';
import { Toggle } from '@/components/ui/Toggle';
import type { NotificationPreferences } from '@/types';
import { updateNotificationPreferences } from '@/lib/notifications/actions';

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationPreferencesProps {
  initialPrefs?: Partial<NotificationPreferences>;
  /** Customer's WhatsApp number on file (E.164), if set. */
  whatsappNumber?: string | null;
}

// ─── Default prefs ────────────────────────────────────────────────────────────

const DEFAULTS: NotificationPreferences = {
  whatsapp_enabled: true,
  sms_enabled: true,
  email_enabled: true,
  do_not_disturb_start: '19:00',
  do_not_disturb_end: '09:00',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPreferences({
  initialPrefs,
  whatsappNumber,
}: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULTS,
    ...initialPrefs,
  });

  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
    setErrorMessage(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs);
      if (result.success) {
        setSavedMessage('Preferences saved.');
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error ?? 'Failed to save preferences.');
        setSavedMessage(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── WhatsApp ──────────────────────────────────────────────────────── */}
      <SettingsSection
        title="WhatsApp"
        description="Recommended — 98% read rate, delivered within 3 minutes."
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Enable WhatsApp notifications</p>
            {whatsappNumber ? (
              <p className="text-xs text-teal mt-0.5">✅ Linked to {whatsappNumber}</p>
            ) : (
              <p className="text-xs text-line mt-0.5">
                Add your WhatsApp number in profile settings to enable.
              </p>
            )}
          </div>
          <Toggle
            checked={prefs.whatsapp_enabled}
            onChange={(e) => updatePref('whatsapp_enabled', e.target.checked)}
            disabled={!whatsappNumber}
            aria-label="Enable WhatsApp notifications"
          />
        </div>

        <p className="text-xs text-line pt-1">
          Receive job updates, arrival alerts, and quote notifications on WhatsApp.
        </p>
      </SettingsSection>

      {/* ── SMS ───────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="SMS"
        description="Backup channel — works on all phones, no internet required."
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Enable SMS notifications</p>
            <p className="text-xs text-line mt-0.5">
              Used for urgent alerts (payment failures, cancellations).
            </p>
          </div>
          <Toggle
            checked={prefs.sms_enabled}
            onChange={(e) => updatePref('sms_enabled', e.target.checked)}
            aria-label="Enable SMS notifications"
          />
        </div>
      </SettingsSection>

      {/* ── Email ─────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Email"
        description="Required — invoices, documents, and compliance communications."
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Email notifications</p>
            <p className="text-xs text-line mt-0.5">
              Invoices, service reports, and account updates are always sent via email
              as required by our{' '}
              <a
                href="/privacy"
                className="text-teal underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
          {/* Email is always on — DPDP Act compliance */}
          <Toggle
            checked={true}
            disabled={true}
            aria-label="Email notifications (required)"
          />
        </div>
        <p className="text-xs bg-line/10 rounded px-3 py-2 text-line">
          Email cannot be disabled. It is required under India&apos;s Digital Personal Data
          Protection Act (DPDP) for service communications.
        </p>
      </SettingsSection>

      {/* ── Do Not Disturb ────────────────────────────────────────────────── */}
      <SettingsSection
        title="Do Not Disturb"
        description="Notifications are paused during this window. Payment failures and cancellations always come through."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="dnd-start" className="text-sm font-medium text-ink block">
              From
            </label>
            <input
              id="dnd-start"
              type="time"
              value={prefs.do_not_disturb_start}
              onChange={(e) => updatePref('do_not_disturb_start', e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="dnd-end" className="text-sm font-medium text-ink block">
              Until
            </label>
            <input
              id="dnd-end"
              type="time"
              value={prefs.do_not_disturb_end}
              onChange={(e) => updatePref('do_not_disturb_end', e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
        </div>

        <p className="text-xs text-line">
          Default: 7:00 PM – 9:00 AM. All times are in Indian Standard Time (IST).
        </p>
      </SettingsSection>

      {/* ── Save button + feedback ────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Saving…' : 'Save preferences'}
        </button>

        {savedMessage && (
          <p className="text-sm text-teal font-medium" role="status">
            {savedMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-danger font-medium" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
