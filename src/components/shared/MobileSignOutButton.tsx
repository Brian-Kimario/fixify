/**
 * Mobile Sign-Out Button Component
 * 
 * Compact sign-out button for mobile navigation
 * Opens a confirmation dialog before signing out
 */

'use client';

import { useState } from 'react';
import { signOutAction } from '@/app/auth/signout-action';

interface MobileSignOutButtonProps {
  displayName: string;
}

export function MobileSignOutButton({ displayName }: MobileSignOutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutAction({ allDevices: false });
    } catch (error) {
      console.error('Sign-out failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Sign Out Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-[#E0E0E0]"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Sign Out</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 animate-in slide-in-from-bottom">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-[#18211F]">Sign Out?</h2>
              <p className="text-sm text-[#5A6661] mt-1">
                You'll need to sign in again on this device.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#F7F4EC] text-[#18211F] font-medium rounded-lg hover:bg-[#E8E5DC] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
