'use client';

import { useState } from 'react';
import { signOutAction } from '@/app/auth/signout-action';

/**
 * Minimal sign-out button for mobile profile pages.
 * The full SignOutMenu is desktop-only (header); this component
 * ensures logout is accessible on mobile via the Account/Profile tab.
 */
export function MobileSignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOutAction({ allDevices: false });
      // redirect() in the server action throws NEXT_REDIRECT — handled below.
      window.location.href = '/auth/login?logged_out=1';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // NEXT_REDIRECT is the expected success path
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#18211F] bg-[#F7F4EC] hover:bg-[#E8E5DC] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#D9DED8]"
        aria-label="Sign out"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#176B5B] border-t-transparent rounded-full animate-spin" />
            Signing out…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </>
        )}
      </button>
    </div>
  );
}
