'use client';

import { useState, useRef, useEffect } from 'react';
import { signOutAction, signOutAllDevicesAction } from '@/app/auth/signout-action';
import type { User } from '@supabase/supabase-js';

interface SignOutMenuProps {
  user: User | null;
  displayName: string;
  initials: string;
  role?: 'customer' | 'professional' | 'admin' | 'support';
}

type MenuState = 'closed' | 'open' | 'loading' | 'error';

export function SignOutMenu({ user, displayName, initials, role }: SignOutMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const [error, setError] = useState<string | null>(null);
  const [showAllDevicesConfirm, setShowAllDevicesConfirm] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate fixed position so the dropdown escapes the header's stacking context
  const openMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuState('open');
  };

  const closeMenu = () => {
    setMenuState('closed');
    setShowAllDevicesConfirm(false);
  };

  // Close on outside click
  useEffect(() => {
    if (menuState !== 'open') return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuState]);

  // Close on Escape key
  useEffect(() => {
    if (menuState !== 'open') return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuState]);

  const handleSignOut = async (allDevices = false) => {
    setMenuState('loading');
    setError(null);
    try {
      if (allDevices) {
        await signOutAllDevicesAction('user_initiated_all_devices');
      } else {
        await signOutAction({ allDevices: false });
      }
      // redirect() in the server action throws NEXT_REDIRECT — handled below.
      // If somehow we get here, do a client fallback.
      window.location.href = '/auth/login?logged_out=1';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // NEXT_REDIRECT is the expected success path from redirect()
      if (msg.includes('NEXT_REDIRECT')) return;
      setError(msg);
      setMenuState('error');
      setTimeout(() => {
        setMenuState('open');
        setError(null);
      }, 3000);
    }
  };

  const handleClearCache = async () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('fixify-') || key.startsWith('supabase-')) {
          localStorage.removeItem(key);
        }
      });
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } catch {
      // non-critical
    }
  };

  if (!user) return null;

  const profileHref =
    role === 'admin' ? '/admin' :
    role === 'professional' ? '/professional/profile' :
    '/customer/profile';

  return (
    <>
      {/* ── Trigger button ───────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => (menuState === 'open' ? closeMenu() : openMenu())}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F0F0F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:ring-offset-1"
        aria-label="User menu"
        aria-expanded={menuState === 'open'}
        aria-haspopup="menu"
      >
        <div className="w-8 h-8 rounded-full bg-[#E2EEE9] flex items-center justify-center text-xs font-bold text-[#0D5144] flex-shrink-0 select-none">
          {initials}
        </div>
        <svg
          className={`w-4 h-4 text-[#5A6661] transition-transform duration-200 flex-shrink-0 ${
            menuState === 'open' ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {/* Rendered with position:fixed so it escapes sticky header stacking context */}
      {menuState !== 'closed' && (
        <div
          ref={menuRef}
          role="menu"
          style={{ ...dropdownStyle, zIndex: 9999 }}
          className="w-80 bg-white rounded-xl border border-[#E0E0E0] shadow-xl"
        >
          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* User info */}
          <div className="p-4 border-b border-[#E0E0E0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E2EEE9] flex items-center justify-center text-sm font-bold text-[#0D5144] select-none">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#18211F] truncate">{displayName}</p>
                <p className="text-xs text-[#5A6661] truncate">{user.email}</p>
                {role && (
                  <p className="text-xs text-[#176B5B] font-medium capitalize mt-0.5">
                    {role === 'professional' ? 'Professional' : role}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="py-2">
            <a
              href={profileHref}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#18211F] hover:bg-[#F7F4EC] transition-colors"
              onClick={closeMenu}
              role="menuitem"
            >
              <svg className="w-4 h-4 text-[#5A6661]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Account Settings
            </a>

            <div className="px-4 py-2.5 border-t border-[#E8E8E8]">
              <p className="text-xs font-medium text-[#5A6661] mb-1">Session</p>
              <p className="text-xs text-[#18211F]">
                <span className="text-[#5A6661]">Status: </span>
                <span className="font-medium text-green-600">● Active</span>
              </p>
            </div>
          </div>

          {/* Sign-out actions */}
          <div className="p-3 border-t border-[#E0E0E0] space-y-2">
            {/* Sign out this device */}
            <button
              onClick={() => handleSignOut(false)}
              disabled={menuState === 'loading'}
              role="menuitem"
              className="w-full px-4 py-2.5 text-sm font-medium text-[#18211F] bg-[#F7F4EC] hover:bg-[#E8E5DC] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {menuState === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#176B5B] border-t-transparent rounded-full animate-spin" />
                  Signing out…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>

            {/* Sign out all devices */}
            {!showAllDevicesConfirm ? (
              <button
                onClick={() => setShowAllDevicesConfirm(true)}
                role="menuitem"
                className="w-full px-4 py-2.5 text-sm font-medium text-[#A85A44] bg-[#FEFAF7] hover:bg-[#F9EFEB] rounded-lg transition-colors border border-[#F0E5DC] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Sign Out All Devices
              </button>
            ) : (
              <div className="px-3 py-2 bg-[#FEF6F3] border border-[#F0E5DC] rounded-lg">
                <p className="text-xs text-[#5A6661] mb-2">
                  This signs you out from every device. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllDevicesConfirm(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-[#5A6661] bg-white border border-[#D9DED8] rounded hover:bg-[#F7F4EC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSignOut(true)}
                    disabled={menuState === 'loading'}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#A85A44] hover:bg-[#934C38] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {menuState === 'loading' ? 'Signing out…' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleClearCache}
              className="w-full px-4 py-2 text-xs text-[#5A6661] hover:text-[#18211F] hover:bg-[#F7F4EC] rounded-lg transition-colors"
            >
              🗑️ Clear Cache
            </button>
          </div>

          <div className="px-4 py-2.5 bg-[#F7F4EC] border-t border-[#E0E0E0] rounded-b-xl text-xs text-[#5A6661]">
            Need help?{' '}
            <a href="/help" className="text-[#176B5B] hover:underline font-medium">
              Contact support
            </a>
          </div>
        </div>
      )}
    </>
  );
}
