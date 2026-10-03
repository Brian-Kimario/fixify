'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reveal - Scroll-triggered fade-in and slide-up animation
 * Observes when element enters viewport and triggers animation
 * Respects prefers-reduced-motion for accessibility
 */
export function Reveal({ children, className = '' }: RevealProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect user's motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    // Set up intersection observer to trigger animation
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={`translate-y-3 opacity-0 transition-[opacity,transform] duration-700 ease-out data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}
