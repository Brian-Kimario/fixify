'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type User } from '@supabase/supabase-js';
import { logoutUser } from './actions';

interface AppNavbarProps {
  user: User;
}

export function AppNavbar({ user }: AppNavbarProps) {
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
          <Link href="/app" className="text-mint font-display font-bold text-xl hover:opacity-80 transition-opacity">
            Fixify
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <span className="text-ink text-sm">{user.email}</span>

            {/* Profile Menu */}
            <div className="relative group">
              <button className="text-line hover:text-ink transition-colors text-sm font-medium">
                Account ▼
              </button>
              <div className="absolute right-0 mt-0 w-48 bg-panel border border-line rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  href="/app/profile"
                  className="block px-4 py-2 text-sm text-ink hover:bg-line rounded-t-lg transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href="/app/profile/edit"
                  className="block px-4 py-2 text-sm text-ink hover:bg-line transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/app/settings"
                  className="block px-4 py-2 text-sm text-ink hover:bg-line transition-colors"
                >
                  Settings
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
              {user.email}
            </div>
            <Link
              href="/app/profile"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              View Profile
            </Link>
            <Link
              href="/app/profile/edit"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Edit Profile
            </Link>
            <Link
              href="/app/settings"
              className="block text-ink hover:text-mint transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full text-left text-red-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50 pt-2 border-t border-line"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
