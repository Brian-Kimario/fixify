'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type User } from '@supabase/supabase-js';
import { logoutUser } from '../customer/actions';

interface ProfessionalNavbarProps {
  user: User;
  profile: any;
}

export function ProfessionalNavbar({ user, profile }: ProfessionalNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await logoutUser();
  }

  return (
    <nav className="border-b border-line bg-panel sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/professional" className="text-mint font-display font-bold text-xl hover:opacity-80 transition-opacity">
            Fixify Professional
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/professional/jobs"
              className="text-line hover:text-mint transition-colors text-sm font-medium"
            >
              Jobs
            </Link>
            <Link
              href="/professional/bids"
              className="text-line hover:text-mint transition-colors text-sm font-medium"
            >
              My Bids
            </Link>
            <Link
              href="/professional/earnings"
              className="text-line hover:text-mint transition-colors text-sm font-medium"
            >
              Earnings
            </Link>
            
            <div className="border-l border-line pl-8">
              <span className="text-ink text-sm">{profile?.full_name || user.email}</span>

              {/* Profile Menu */}
              <div className="relative inline-block ml-4 group">
                <button className="text-line hover:text-ink transition-colors text-sm font-medium">
                  Account ▼
                </button>
                <div className="absolute right-0 mt-0 w-48 bg-panel border border-line rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    href="/professional/profile"
                    className="block px-4 py-2 text-sm text-ink hover:bg-line rounded-t-lg transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/professional/onboarding"
                    className="block px-4 py-2 text-sm text-ink hover:bg-line transition-colors"
                  >
                    Setup
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-line rounded-b-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-line hover:text-ink transition-colors"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-line bg-dark">
          <div className="px-4 py-4 space-y-3">
            <div className="text-ink text-sm pb-3 border-b border-line">
              {profile?.full_name || user.email}
            </div>
            <Link
              href="/professional/jobs"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Jobs
            </Link>
            <Link
              href="/professional/bids"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              My Bids
            </Link>
            <Link
              href="/professional/earnings"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Earnings
            </Link>
            <div className="border-t border-line pt-3 mt-3 space-y-3">
              <Link
                href="/professional/profile"
                className="block text-ink hover:text-mint transition-colors text-sm"
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>
              <Link
                href="/professional/onboarding"
                className="block text-ink hover:text-mint transition-colors text-sm"
                onClick={() => setIsOpen(false)}
              >
                Setup
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full text-left text-red-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
