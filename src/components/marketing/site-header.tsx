'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { Symbol } from '@/components/brand/Symbol';
import { createTimeline, stagger } from 'animejs';

interface SiteHeaderProps {
  user?: User | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const hasAnimatedIn = useRef(false);

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  // Handle scroll event for sticky background state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial header entrance animation using Anime.js
  useEffect(() => {
    if (hasAnimatedIn.current || !navRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    hasAnimatedIn.current = true;

    createTimeline({
      playbackEase: 'out(3)',
    })
      .add('.nav-brand', {
        opacity: [0, 1],
        translateY: [-8, 0],
        duration: 400,
        ease: 'out(3)',
      })
      .add('.nav-link-item', {
        opacity: [0, 1],
        translateY: [-6, 0],
        delay: stagger(60),
        duration: 380,
        ease: 'out(3)',
      }, '-=250')
      .add('.nav-cta-item', {
        opacity: [0, 1],
        translateY: [-6, 0],
        duration: 400,
        ease: 'out(3)',
      }, '-=200');
  }, []);

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled
          ? 'py-3.5 bg-porcelain/90 backdrop-blur-md border-b border-line shadow-[0_4px_20px_rgba(24,33,31,0.04)]'
          : 'py-5 bg-transparent border-b border-transparent'
      }`}
      role="banner"
    >
      <div className="wrap flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link
          className="nav-brand flex items-center gap-2.5 font-bold tracking-tight text-ink hover:opacity-90 transition-opacity"
          href="/"
          aria-label="Fixify home"
        >
          <div className="text-teal">
            <Symbol size="md" />
          </div>
          <span className="text-xl tracking-tight text-ink">Fixify</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          <a
            href="#services"
            className="nav-link-item text-[14px] font-medium text-ink-3 hover:text-ink transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-full after:h-[1.5px] after:bg-teal hover:after:right-0 after:transition-all after:duration-250"
          >
            Services
          </a>
          <a
            href="#how"
            className="nav-link-item text-[14px] font-medium text-ink-3 hover:text-ink transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-full after:h-[1.5px] after:bg-teal hover:after:right-0 after:transition-all after:duration-250"
          >
            How it works
          </a>
          <a
            href="#transparency"
            className="nav-link-item text-[14px] font-medium text-ink-3 hover:text-ink transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-full after:h-[1.5px] after:bg-teal hover:after:right-0 after:transition-all after:duration-250"
          >
            Pricing
          </a>
          <a
            href="#property"
            className="nav-link-item text-[14px] font-medium text-ink-3 hover:text-ink transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-full after:h-[1.5px] after:bg-teal hover:after:right-0 after:transition-all after:duration-250"
          >
            Property record
          </a>
          <a
            href="#professionals"
            className="nav-link-item text-[14px] font-medium text-ink-3 hover:text-ink transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-full after:h-[1.5px] after:bg-teal hover:after:right-0 after:transition-all after:duration-250"
          >
            For professionals
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/customer"
              className="nav-cta-item hidden sm:inline-flex items-center justify-center rounded-lg border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink shadow-sm hover:border-line-strong hover:bg-paper-2 transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="nav-cta-item hidden sm:inline-flex items-center justify-center rounded-lg border border-line bg-paper/80 px-3.5 py-2 text-xs font-semibold text-ink hover:border-line-strong hover:bg-paper transition-all"
            >
              Sign in
            </Link>
          )}

          {user ? (
            <Link
              href="/customer"
              className="nav-cta-item inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-paper shadow-[0_6px_16px_rgba(23,107,91,0.18)] hover:bg-teal-deep hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span>Describe a problem</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="nav-cta-item inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-paper shadow-[0_6px_16px_rgba(23,107,91,0.18)] hover:bg-teal-deep hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span>Describe a problem</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper text-ink"
            aria-label="Open menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-sm font-semibold">{isOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-3 border-b border-line bg-porcelain px-6 py-5 shadow-lg">
          <nav className="flex flex-col space-y-3">
            <a
              href="#services"
              className="text-sm font-medium text-ink py-1.5 border-b border-line/50"
              onClick={() => setIsOpen(false)}
            >
              Services
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-ink py-1.5 border-b border-line/50"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </a>
            <a
              href="#transparency"
              className="text-sm font-medium text-ink py-1.5 border-b border-line/50"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#property"
              className="text-sm font-medium text-ink py-1.5 border-b border-line/50"
              onClick={() => setIsOpen(false)}
            >
              Property record
            </a>
            <a
              href="#professionals"
              className="text-sm font-medium text-ink py-1.5"
              onClick={() => setIsOpen(false)}
            >
              For professionals
            </a>
            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="w-full text-center rounded-lg border border-line bg-paper py-2 text-xs font-semibold text-ink"
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </Link>
              {user ? (
                <Link
                  href="/customer"
                  className="w-full text-center rounded-lg bg-teal py-2 text-xs font-semibold text-paper"
                  onClick={() => setIsOpen(false)}
                >
                  Describe a problem →
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="w-full text-center rounded-lg bg-teal py-2 text-xs font-semibold text-paper"
                  onClick={() => setIsOpen(false)}
                >
                  Describe a problem →
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
