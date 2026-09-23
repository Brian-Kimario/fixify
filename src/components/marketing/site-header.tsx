'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type User } from '@supabase/supabase-js';

interface SiteHeaderProps {
  user?: User | null;
  profile?: any;
}

export function SiteHeader({ user, profile }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const isCustomerApp = pathname?.startsWith('/app');
  const isProfessionalApp = pathname?.startsWith('/pro');

  return (
    <header className="border-b border-line bg-dark/50 backdrop-blur-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-dark text-sm">F</span>
            </div>
            <span className="font-display font-bold text-ink hidden sm:inline">
              Fixify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/services" className="text-line hover:text-ink transition-colors text-sm font-medium">
              Services
            </Link>
            <Link href="/how-it-works" className="text-line hover:text-ink transition-colors text-sm font-medium">
              How it works
            </Link>
            <Link href="/professionals" className="text-line hover:text-ink transition-colors text-sm font-medium">
              For professionals
            </Link>
            <Link href="/help" className="text-line hover:text-ink transition-colors text-sm font-medium">
              Help
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user && profile?.role === 'professional' ? (
              <>
                <Link href="/pro" className="text-ink text-sm font-medium hover:text-mint transition-colors">
                  My Pro
                </Link>
              </>
            ) : user && profile?.role === 'customer' ? (
              <>
                <Link href="/app" className="text-ink text-sm font-medium hover:text-mint transition-colors">
                  My Fixify
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-ink text-sm font-medium hover:text-mint transition-colors">
                Sign in
              </Link>
            )}

            <Link href={user && profile?.role === 'customer' ? '/app' : '/'}>
              <button className="px-4 py-2 bg-mint text-dark rounded-lg font-medium text-sm hover:bg-mint/90 transition-colors">
                {user && profile?.role === 'customer'
                  ? 'Describe a problem'
                  : 'Get started'}
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-line hover:text-ink transition-colors"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-line bg-dark/95 backdrop-blur">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/services"
                className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/how-it-works"
                className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                How it works
              </Link>
              <Link
                href="/professionals"
                className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                For professionals
              </Link>
              <Link
                href="/help"
                className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Help
              </Link>

              <div className="border-t border-line pt-3 space-y-3">
                {user && profile?.role === 'professional' ? (
                  <>
                    <Link
                      href="/pro"
                      className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      My Pro
                    </Link>
                  </>
                ) : user && profile?.role === 'customer' ? (
                  <>
                    <Link
                      href="/app"
                      className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      My Fixify
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block text-ink hover:text-mint transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign in
                  </Link>
                )}

                <Link href={user && profile?.role === 'customer' ? '/app' : '/'}>
                  <button
                    className="w-full px-4 py-2 bg-mint text-dark rounded-lg font-medium text-sm hover:bg-mint/90 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {user && profile?.role === 'customer'
                      ? 'Describe a problem'
                      : 'Get started'}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
