'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Symbol } from '@/components/brand/Symbol';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

export type NavRole = 'customer' | 'professional' | 'admin' | 'marketing';

interface NavLink {
  label: string;
  href: string;
  active: boolean;
}

interface UserInfo {
  displayName: string;
  email: string;
  role: string;
  initial: string;
}

interface AppNavbarProps {
  role: NavRole;
  user?: UserInfo;
  onLogout?: () => void | Promise<void>;
  isLoading?: boolean;
  customLinks?: NavLink[];
}

/**
 * Get nav links for a specific role
 */
function getNavLinksForRole(role: NavRole, pathname: string, searchParams: URLSearchParams): NavLink[] {
  const currentTab = searchParams.get('tab') || 'overview';

  switch (role) {
    case 'customer':
      return [
        { label: 'Overview', href: '/customer', active: pathname === '/customer' && currentTab === 'overview' },
        { label: 'Active Dispatch', href: '/customer?tab=dispatch', active: pathname === '/customer' && currentTab === 'dispatch' },
        { label: 'Book Service', href: '/customer?tab=intake', active: pathname === '/customer' && currentTab === 'intake' },
        { label: 'My Properties', href: '/customer/properties', active: pathname.startsWith('/customer/properties') },
        { label: 'Service History', href: '/customer?tab=records', active: pathname === '/customer' && currentTab === 'records' },
        { label: 'Help', href: '/help', active: pathname === '/help' },
      ];

    case 'professional':
      return [
        { label: 'Overview', href: '/professional', active: pathname === '/professional' && currentTab === 'overview' },
        { label: 'Active Job', href: '/professional?tab=workspace', active: pathname === '/professional' && currentTab === 'workspace' },
        { label: "Today's Route", href: '/professional?tab=route', active: pathname === '/professional' && currentTab === 'route' },
        { label: 'Available Jobs', href: '/professional?tab=requests', active: pathname === '/professional' && currentTab === 'requests' },
        { label: 'Earnings & Payouts', href: '/professional?tab=earnings', active: pathname === '/professional' && currentTab === 'earnings' },
      ];

    case 'admin':
      // Admin typically uses sidebar or full navigation system, not classic navbar
      return [];

    case 'marketing':
    default:
      return [
        { label: 'Services', href: '/#services', active: false },
        { label: 'How it works', href: '/#how-it-works', active: false },
        { label: 'For professionals', href: '/#professionals', active: false },
        { label: 'Help', href: '/help', active: pathname === '/help' },
      ];
  }
}

/**
 * Desktop Navigation Links
 */
function DesktopNavLinks({ links, responsive = false }: { links: NavLink[]; responsive?: boolean }) {
  return (
    <nav
      className={`items-center gap-1 ${responsive ? 'hidden md:flex' : 'flex'}`}
      aria-label="Main navigation"
    >
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          aria-current={link.active ? 'page' : undefined}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
            link.active
              ? 'bg-teal text-paper font-semibold shadow-xs'
              : 'text-ink-3 hover:text-ink hover:bg-porcelain font-medium'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Mobile Navigation Links
 */
function MobileNavLinks({ links, onClose }: { links: NavLink[]; onClose: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Mobile navigation">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onClose}
          aria-current={link.active ? 'page' : undefined}
          className={`block px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-inset ${
            link.active
              ? 'bg-teal/10 text-teal font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-porcelain font-medium'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * User Account Dropdown (Desktop)
 */
function UserDropdown({
  user,
  role,
  isDropdownOpen,
  setIsDropdownOpen,
  isLoading,
  onLogout,
  dropdownRef,
}: {
  user: UserInfo;
  role: NavRole;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isLoading: boolean;
  onLogout: () => void | Promise<void>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Determine role badge color and text
  const getRoleBadgeClass = () => {
    switch (role) {
      case 'customer':
        return 'bg-paper border border-line text-ink-3';
      case 'professional':
        return 'bg-teal-soft border border-teal/20 text-teal';
      case 'admin':
        return 'bg-paper border border-line text-ink-3';
      default:
        return 'bg-paper border border-line text-ink-3';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'customer':
        return 'RESIDENCE ACCOUNT';
      case 'professional':
        return 'FIELD CONSOLE';
      case 'admin':
        return 'ADMIN';
      default:
        return 'ACCOUNT';
    }
  };

  const avatarBgClass = role === 'professional' ? 'bg-teal text-paper' : 'bg-teal-soft text-teal';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-porcelain border border-transparent hover:border-line transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        aria-label={`Account menu for ${user.displayName}`}
      >
        <div className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center border border-transparent ${avatarBgClass}`}>
          {user.initial}
        </div>
        <span className="text-xs font-medium text-ink max-w-[120px] truncate">
          {user.displayName}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-ink-4 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-paper border border-line rounded-xl shadow-xl py-1.5 z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-100 motion-reduce:animate-none">
          <div className="px-4 py-2.5 border-b border-line bg-porcelain/50">
            <p className="text-xs font-bold text-ink truncate">{user.displayName}</p>
            <p className="text-[11px] text-ink-4 truncate">{user.email}</p>
            <span className={`inline-block mt-1 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${getRoleBadgeClass()}`}>
              {getRoleLabel()}
            </span>
          </div>

          <div className="py-1">
            {role === 'customer' && (
              <>
                <Link
                  href="/customer"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
                >
                  <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard Overview
                </Link>
                <Link
                  href="/customer/properties"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
                >
                  <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Manage Properties
                </Link>
              </>
            )}

            {role === 'professional' && (
              <>
                <Link
                  href="/professional"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
                >
                  <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Field Console
                </Link>
                <Link
                  href="/professional?tab=earnings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
                >
                  <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Settlement records
                </Link>
              </>
            )}
          </div>

          {role !== 'admin' && <div className="border-t border-line my-1" />}

          <Link
            href="/help"
            onClick={() => setIsDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-porcelain transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
          >
            <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help & FAQ
          </Link>

          <div className="border-t border-line my-1" />

          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              onLogout();
            }}
            disabled={isLoading}
            className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs text-danger hover:bg-danger/5 transition-colors font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Unified App Navigation Bar Component
 *
 * Supports all roles: customer, professional, admin, marketing
 * Responsive (mobile drawer + desktop menu)
 * Keyboard accessible (focus indicators, arrow keys, Escape)
 */
export function AppNavbar({
  role,
  user,
  onLogout,
  isLoading = false,
  customLinks,
}: AppNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get navigation links for this role
  const navLinks = customLinks || getNavLinksForRole(role, pathname, searchParams);

  // Handle dropdown close on outside click and Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsOpen(false);
      }
    }

    if (isDropdownOpen || isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen, isOpen]);

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      // Default logout behavior
      const supabase = createBrowserSupabase();
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[AppNavbar] Sign out error:', e);
      }

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}

      window.location.href = '/auth/logout';
    }
  };

  // Determine logo link based on role
  const getLogoHref = () => {
    switch (role) {
      case 'customer':
        return '/customer';
      case 'professional':
        return '/professional';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const getRoleBadgeText = () => {
    switch (role) {
      case 'customer':
        return 'RESIDENCE';
      case 'professional':
        return 'FIELD CONSOLE';
      case 'admin':
        return 'ADMIN';
      default:
        return '';
    }
  };

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'customer':
        return 'text-ink-4 bg-porcelain border border-line';
      case 'professional':
        return 'text-teal bg-teal-soft border border-teal/20';
      case 'admin':
        return 'text-danger bg-danger-soft border border-danger/20';
      default:
        return 'text-ink-4 bg-porcelain border border-line';
    }
  };

  // Admin gets a different, minimal header (no classic navbar for them)
  if (role === 'admin') {
    return null; // Admin uses custom layout header
  }

  return (
    <nav className="border-b border-line bg-paper sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href={getLogoHref()}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-lg"
              aria-label={`Fixify ${getRoleBadgeText()}`}
            >
              <Symbol size="sm" className={role === 'professional' ? 'text-teal' : 'text-teal'} />
              <span className="font-display font-bold text-xl text-ink tracking-tight">Fixify</span>
              {getRoleBadgeText() && (
                <span className={`hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${getRoleBadgeClass()}`}>
                  {getRoleBadgeText()}
                </span>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            {navLinks.length > 0 && (
              <Suspense fallback={<div className="h-8 w-48" />}>
                <DesktopNavLinks links={navLinks} responsive={true} />
              </Suspense>
            )}
          </div>

          {/* Right User Account Controls (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              {role === 'professional' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-porcelain rounded-full border border-line text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-success motion-safe:animate-pulse" />
                  <span className="font-medium text-ink-3 text-[11px] uppercase tracking-wide">AVAILABILITY</span>
                </div>
              )}
              <Suspense fallback={<div className="w-32 h-10" />}>
                <UserDropdown
                  user={user}
                  role={role}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  isLoading={isLoading}
                  onLogout={handleLogout}
                  dropdownRef={dropdownRef}
                />
              </Suspense>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
        <div id="mobile-navigation" className="md:hidden border-t border-line bg-paper px-4 py-4 space-y-4 shadow-md motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-150 motion-reduce:animate-none">
          {user && (
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className={`w-8 h-8 rounded-full font-mono text-sm font-bold flex items-center justify-center ${role === 'professional' ? 'bg-teal text-paper' : 'bg-teal-soft text-teal'}`}>
                {user.initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{user.displayName}</p>
                <p className="text-[11px] text-ink-4 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {navLinks.length > 0 && (
            <Suspense fallback={<div className="h-20" />}>
              <MobileNavLinks links={navLinks} onClose={() => setIsOpen(false)} />
            </Suspense>
          )}

          {user && (
            <div className="pt-3 border-t border-line space-y-1">
              {role === 'customer' && (
                <>
                  <Link
                    href="/customer/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/customer/settings"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    Settings
                  </Link>
                </>
              )}
              <Link
                href="/help"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-ink-3 hover:text-ink hover:bg-porcelain rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                Help & Support
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50"
              >
                {isLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
