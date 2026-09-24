'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { Icon } from '@/components/ui/icon';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

interface SiteHeaderProps {
  user?: User | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  // Handle scroll event for sticky background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 22);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`public-nav ${isScrolled ? 'scrolled' : ''}`}
      role="banner"
    >
      <div className="wrap public-row">
        {/* Brand Logo */}
        <Link className="brand" href="/" aria-label="Fixify home">
          <svg
            className="brand-mark"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M8 30 24 13l16 17M24 13 15 35M24 13l9 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle className="node" cx="24" cy="13" r="3.6" />
          </svg>
          <span>Fixify</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="public-links" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#how">How it works</a>
          <a href="/professionals">For professionals</a>
          <a href="/help">Help</a>
        </nav>

        {/* Right Actions */}
        <div className="public-actions">
          <Link href="/auth/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/app/requests/new" className="btn btn-primary">
            Describe a problem
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="menu-btn"
            id="menuBtn"
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="mobileMenu"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Icon
              icon={isOpen ? faTimes : faBars}
              size="lg"
              currentColor
              decorative
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className="mobile-menu"
        id="mobileMenu"
        aria-hidden={!isOpen}
      >
        <a href="#services" onClick={() => setIsOpen(false)}>
          Services
        </a>
        <a href="#how" onClick={() => setIsOpen(false)}>
          How it works
        </a>
        <a href="/professionals" onClick={() => setIsOpen(false)}>
          For professionals
        </a>
        <a href="/help" onClick={() => setIsOpen(false)}>
          Help
        </a>
        <div className="menu-actions">
          <Link
            href="/auth/login"
            className="btn btn-ghost"
            onClick={() => setIsOpen(false)}
          >
            Sign in
          </Link>
          <Link
            href="/app/requests/new"
            className="btn btn-primary"
            onClick={() => setIsOpen(false)}
          >
            Describe a problem
          </Link>
        </div>
      </div>
    </header>
  );
}
