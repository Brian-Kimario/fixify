'use client';

import { useEffect } from 'react';
import '@/lib/gsap/setup'; // Register GSAP plugins

/**
 * AnimationProvider
 *
 * Activates two animation systems:
 * 1. GSAP + ScrollTrigger for advanced timeline animations (via useGSAP hook in components)
 * 2. [data-reveal] — fade-up individual elements when they enter the viewport
 * 3. [data-stagger] — stagger-animate a container's direct children
 *
 * Respects prefers-reduced-motion.
 */
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const options: IntersectionObserverInit = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observe all reveal + stagger elements
    const targets = document.querySelectorAll('[data-reveal], [data-stagger]');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
