'use client';

import { useEffect, type RefObject } from 'react';
import { createTimeline, stagger } from 'animejs';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function PremiumSplitHeadline({
  lines,
  className = '',
}: {
  lines: { text: string; emphasis?: boolean }[];
  className?: string;
}) {
  return (
    <>
      <span className="sr-only">{lines.map((line) => line.text).join(' ')}</span>
      {lines.map((line, lineIndex) => (
        <span key={`${line.text}-${lineIndex}`} className={`premium-headline-line ${line.emphasis ? 'premium-headline-emphasis' : ''} ${className}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }} aria-hidden="true">
          {Array.from(line.text).map((character, characterIndex) => (
            <span className="premium-headline-char" style={{ display: 'inline-block' }} key={`${character}-${characterIndex}`}>
              {character === ' ' ? '\u00a0' : character}
            </span>
          ))}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
      <style jsx global>{`
        .premium-headline-line { display: inline-block; white-space: nowrap; }
        .premium-headline-char { display: inline-block; opacity: 0; transform-origin: 50% 100%; will-change: transform, opacity; }
        .premium-headline-emphasis { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: var(--color-teal); letter-spacing: -0.04em; }
      `}</style>
    </>
  );
}

export function usePremiumHeroMotion(
  scopeRef: RefObject<HTMLElement | null>,
  mainRef: RefObject<HTMLElement | null>,
  secondaryRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const scope = scopeRef.current;
    const main = mainRef.current;
    const secondary = secondaryRef.current;
    if (!scope || !main || !secondary) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headlineChars = Array.from(scope.querySelectorAll<HTMLElement>('.premium-headline-char'));
    let timeline: ReturnType<typeof createTimeline> | null = null;

    if (!reduced) {
      timeline = createTimeline({ autoplay: false, defaults: { ease: 'outQuart' } });
      timeline
        .add(headlineChars, {
          opacity: [0, 1],
          translateY: ['115%', '0%'],
          rotateX: [-50, 0],
          duration: 760,
          delay: stagger(26),
        }, 80)
        .add(main, {
          opacity: [0, 1],
          translateY: [34, 0],
          scale: [0.965, 1],
          duration: 900,
          ease: 'outExpo',
        }, 120)
        .add(secondary, {
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.86, 1],
          duration: 980,
          ease: 'outElastic(1, .72)',
        }, 270)
        .play();
    } else {
      headlineChars.forEach((character) => { character.style.opacity = '1'; character.style.transform = 'none'; });
      main.style.opacity = '1';
      secondary.style.opacity = '1';
    }

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      if (reduced) return;
      const rect = scope.getBoundingClientRect();
      const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
      main.style.setProperty('--hero-parallax-y', `${progress * -18}px`);
      secondary.style.setProperty('--hero-parallax-y', `${progress * -34}px`);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateParallax); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      timeline?.pause();
      timeline?.cancel();
      headlineChars.forEach((character) => { character.style.removeProperty('opacity'); character.style.removeProperty('transform'); });
      main.style.removeProperty('--hero-parallax-y');
      secondary.style.removeProperty('--hero-parallax-y');
    };
  }, [mainRef, scopeRef, secondaryRef]);
}
