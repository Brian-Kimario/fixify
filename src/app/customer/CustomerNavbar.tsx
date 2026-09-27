'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { Symbol } from '@/components/brand/Symbol';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

interface CustomerNavbarProps {
  user: User;
}

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const links = [
    { label: 'Overview', href: '/customer', active: pathname === '/customer' && currentTab === 'overview' },
    { label: 'Active Dispatch', href: '/customer?tab=dispatch', active: pathname === '/customer' && currentTab === 'dispatch' },
    { label: 'Book Service', href: '/customer?tab=intake', active: pathname === '/customer' && currentTab === 'intake' },
    { label: 'My Properties', href: '/customer/properties', active: pathname.startsWith('/customer/properties') },
    { label: 'Service History', href: '/customer?tab=records', active: pathname === '/customer' && currentTab === 'records' },
    { label: 'Help', href: '/help', active: pathname === '/help' },
  ];

  return (
    <div className="hidden md:flex items-center gap-1">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            link.active
              ? 'bg-teal text-paper font-semibold shadow-xs'
              : 'text-ink-3 hover:text-ink hover:bg-porcelain font-medium'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const links = [
    { label: 'Overview Dashboard', href: '/customer', active: pathname === '/customer' && currentTab === 'overview' },
    { label: 'Active Dispatch', href: '/customer?tab=dispatch', active: pathname === '/customer' && currentTab === 'dispatch' },
    { label: 'Book a Service', href: '/customer?tab=intake', active: pathname === '/customer' && currentTab === 'intake' },
    { label: 'My Properties', href: '/customer/properties', active: pathname.startsWith('/customer/properties') },
    { label: 'Service History & Records', href: '/customer?tab=records', active: pathname === '/customer' && currentTab === 'records' },
    { label: 'Help & Support', href: '/help', active: pathname === '/help' },
  ];

  return (
    <div className="space-y-1">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onClose}
          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
            link.active
              ? 'bg-teal/10 text-teal font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-porcelain font-medium'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function CustomerNavbar({ user }: CustomerNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  async function handleLogout() {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Navbar] Client sign out error:', e);
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    // Hard navigation to dedicated route handler to guarantee clean server cookie clearance & redirect
    window.location.href = '/auth/logout';
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'C';
  const displayName = user.email?.split('@')[0] || 'Customer';

  return (
    <nav className="border-b border-line bg-paper sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/customer"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              aria-label="Fixify Customer Residence"
            >
              <Symbol size="sm" className="text-teal" />
              <span className="font-display font-bold text-xl text-ink tracking-tight">Fixify</span>
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-ink-4 bg-porcelain px-2 py-0.5 rounded border border-line">
                RESIDENCE
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <Suspense fallback={<div className="h-8 w-48" />}>
              <NavLinks />
            </Suspense>
          </div>

          {/* Right User Account Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Account Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-porcelain border border-transparent hover:border-line transition-all focus:outline-none focus:ring-2 focus:ring-teal/30"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-teal-soft text-teal font-mono text-xs font-bold flex items-center justify-center border border-teal/20">
                  {userInitial}
                </div>
                <span className="text-xs font-medium text-ink max-w-[120px] truncate">
                  {displayName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-ink-4 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-paper border border-line rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-line bg-porcelain/50">
                    <p className="text-xs font-bold text-ink truncate">{displayName}</p>
                    <p className="text-[11px] text-ink-4 truncate">{user.email}</p>
                    <span className="inline-block mt-1 font-mono text-[9px] uppercase px-1.5 py-0.5 bg-paper border border-line rounded text-ink-3">
                      RESIDENCE ACCOUNT
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/customer"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard Overview
                    </Link>
                    <Link
                      href="/customer/properties"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Manage Properties
                    </Link>
                  </div>
                  <div className="border-t border-line my-1" />
                  <Link
                    href="/help"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & FAQ
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs text-danger hover:bg-danger/5 transition-colors font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {isLoading ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-line bg-paper px-4 py-4 space-y-4 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3 pb-3 border-b border-line">
            <div className="w-8 h-8 rounded-full bg-teal-soft text-teal font-mono text-sm font-bold flex items-center justify-center">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink truncate">{displayName}</p>
              <p className="text-[11px] text-ink-4 truncate">{user.email}</p>
            </div>
          </div>

          <Suspense fallback={<div className="h-20" />}>
            <MobileNavLinks onClose={() => setIsOpen(false)} />
          </Suspense>

          <div className="pt-3 border-t border-line space-y-1">
            <Link
              href="/customer/profile"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg"
            >
              Profile
            </Link>
            <Link
              href="/customer/settings"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg"
            >
              Settings
            </Link>
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg"
            >
              Help & Support
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full text-left px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
