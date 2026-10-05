'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, ShieldCheck } from 'lucide-react';
import { PremiumSplitHeadline, usePremiumHeroMotion } from '@/components/ui/animations/premium-motion';

interface RepairCategory {
  id: string;
  label: string;
  images: { before: string; after: string };
  caption: string;
}

interface RepairSceneHeroProps {
  categories: RepairCategory[];
  defaultCategory?: string;
}

type Slide = {
  id: string;
  label: string;
  title: string;
  detail: string;
  image: string;
  secondary: string;
  accent: string;
};

const slides: Slide[] = [
  {
    id: 'plumbing', label: 'Plumbing', title: 'A dripping tap becomes a proper repair.',
    detail: 'A verified plumbing technician checks the fault, explains the fix and leaves the kitchen working again.',
    image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/Ha2ovwv97CHNr5m2o2zXhg.webp',
    secondary: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/8nMiwEpWNrvBsKMScgwPtU.jpg',
    accent: '#c8e6df',
  },
  {
    id: 'electrical', label: 'Electrical', title: 'A flickering light gets inspected safely.',
    detail: 'A qualified electrician traces the issue before touching the wiring, then records the work for the property.',
    image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/DHK7gQoeM3JUL5gB7vBw8e.jpg',
    secondary: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/cQBNKRqYsaS9m7sggUhnL5.jpg',
    accent: '#f3ddb0',
  },
  {
    id: 'ac-cooling', label: 'AC & cooling', title: 'A struggling AC gets back to cool.',
    detail: 'The right technician checks airflow, identifies the cause and gives you a clear next step before extra work.',
    image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/AyFYZqcj3vTEWrifMeGyaN.jpg',
    secondary: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/k5WpKfrvfuahMyVxbcc5E5.jpg',
    accent: '#cce4ec',
  },
  {
    id: 'appliances', label: 'Appliances', title: 'A faulty appliance returns to daily life.',
    detail: 'From the first photo to the final test, Fixify keeps the repair understandable and the outcome visible.',
    image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/w4jA8jF4SYQC3cxxjFjhQH.webp',
    secondary: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/DmyGL5sPA86PRKsDiadcRH.jpg',
    accent: '#efd3cc',
  },
];

export function RepairSceneHero({ categories, defaultCategory }: RepairSceneHeroProps) {
  const initialIndex = Math.max(0, slides.findIndex((slide) => slide.id === defaultCategory || categories.some((category) => category.id === slide.id && category.id === defaultCategory)));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const slide = slides[activeIndex];
  const heroRef = useRef<HTMLElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const secondaryCardRef = useRef<HTMLDivElement>(null);
  usePremiumHeroMotion(heroRef, mainCardRef, secondaryCardRef);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [playing]);

  const goTo = (index: number) => setActiveIndex((index + slides.length) % slides.length);

  return (
    <section ref={heroRef} className="repair-scene-hero" id="top">
      <div className="hero-wrap">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="kicker-dot" /> PROPERTY CARE / MADE CLEAR</p>
          <h1 className="hero-headline" aria-label="Your problem. Fixed properly."><PremiumSplitHeadline lines={[{ text: 'Your problem.' }, { text: 'Fixed properly.', emphasis: true }]} /></h1>
          <p className="hero-lead">Tell Fixify what&apos;s happening at your property. We connect the everyday problem to the right verified technician, then keep the work clear from first visit to final fix.</p>
          <div className="category-selector" aria-label="Choose a repair story">
            {slides.map((item, index) => <button key={item.id} type="button" onClick={() => { goTo(index); setPlaying(false); }} className={`selector-option ${activeIndex === index ? 'active' : ''}`} aria-pressed={activeIndex === index}>{item.label}</button>)}
          </div>
          <div className="hero-actions"><a href="/customer" className="hero-cta">Describe a problem <ArrowUpRight size={16} /></a><a href="#how" className="hero-secondary">See the journey <span>↓</span></a></div>
          <div className="hero-trust"><span><ShieldCheck size={15} /> Verified technicians</span><span>Clear approval before extra work</span></div>
        </div>

        <div className="repair-showcase" aria-live="polite">
          <div ref={mainCardRef} className="showcase-main premium-hero-card" style={{ backgroundColor: slide.accent }}>
            <Image
              key={slide.image}
              src={slide.image}
              alt={`${slide.label} technician repair in progress`}
              fill
              sizes="(max-width: 1000px) 100vw, 60vw"
              priority={activeIndex === 0}
              className="object-cover"
            />
            <div className="showcase-shade" />
            <div className="showcase-topline"><span>FIXIFY / REPAIR STORY</span><span>{String(activeIndex + 1).padStart(2, '0')} / 04</span></div>
            <div className="showcase-copy"><span className="showcase-label">{slide.label}</span><h2>{slide.title}</h2><p>{slide.detail}</p></div>
          </div>
          <div ref={secondaryCardRef} className="showcase-secondary premium-hero-card">
            <Image
              src={slide.secondary}
              alt={`${slide.label} completed repair detail`}
              fill
              sizes="(max-width: 1000px) 33vw, 20vw"
              className="object-cover"
            />
            <span>THE RESULT</span>
          </div>
          <div className="showcase-controls"><button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous repair story"><ChevronLeft size={17} /></button><div className="showcase-progress">{slides.map((item, index) => <button key={item.id} type="button" aria-label={`Show ${item.label} story`} aria-current={activeIndex === index} onClick={() => { goTo(index); setPlaying(false); }}><span style={{ transform: `scaleX(${activeIndex === index ? 1 : 0})` }} /></button>)}</div><button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next repair story"><ChevronRight size={17} /></button><button type="button" className="showcase-play" onClick={() => setPlaying((current) => !current)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button></div>
          <p className="showcase-caption">Real problems. Real technicians. One managed path from concern to complete.</p>
        </div>
      </div>
      <style jsx>{`
        .repair-scene-hero{position:relative;overflow:hidden;padding:148px 0 110px;background:linear-gradient(135deg,#f7f4ec 0%,#f7f4ec 48%,#eef3ee 100%)}.hero-wrap{width:min(var(--max),calc(100% - 48px));margin:0 auto;display:grid;grid-template-columns:minmax(0,.76fr) minmax(550px,1.24fr);gap:clamp(46px,6vw,88px);align-items:center}.hero-copy{position:relative;z-index:2}.hero-kicker{display:flex;align-items:center;gap:8px;color:var(--color-teal);font:700 11px var(--font-mono);letter-spacing:.13em;margin:0 0 18px}.kicker-dot{width:7px;height:7px;border-radius:50%;background:#d39b32;box-shadow:0 0 0 5px rgba(211,155,50,.14)}.hero-headline{perspective:900px;overflow:visible;font-size:clamp(54px,6.2vw,84px);max-width:10ch;line-height:.98;letter-spacing:-.06em;font-weight:700;color:var(--color-ink);margin:0}.premium-headline-line{display:inline-block;white-space:nowrap}.premium-headline-char{display:inline-block;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}.premium-headline-emphasis{font-family:var(--font-serif);font-style:italic;font-weight:400;color:var(--color-teal);letter-spacing:-.04em}.hero-headline em{font-family:var(--font-serif);font-style:italic;font-weight:400;color:var(--color-teal);letter-spacing:-.04em}.hero-lead{font-size:18px;line-height:1.62;color:var(--color-ink-3);max-width:48ch;margin:26px 0 30px}.category-selector{display:flex;gap:21px;flex-wrap:wrap}.selector-option{background:none;border:0;padding:0;color:var(--color-ink-3);cursor:pointer;font-size:14px;font-weight:500;position:relative;transition:color .2s ease}.selector-option:hover,.selector-option.active{color:var(--color-ink)}.selector-option.active{font-weight:700}.selector-option.active:after{content:'';position:absolute;left:0;right:0;bottom:-9px;height:2px;background:var(--color-teal)}.hero-actions{display:flex;align-items:center;gap:22px;margin-top:36px}.hero-cta{display:inline-flex;align-items:center;gap:7px;padding:15px 21px;background:var(--color-teal);color:white;text-decoration:none;border-radius:11px;font-weight:700;font-size:14px;box-shadow:0 12px 26px rgba(23,107,91,.18);transition:transform .24s,background .24s}.hero-cta:hover{background:var(--color-teal-deep);transform:translateY(-2px)}.hero-secondary{font-size:14px;font-weight:600;color:var(--color-ink);text-decoration:none}.hero-secondary span{color:var(--color-teal);margin-left:4px}.hero-trust{display:flex;gap:18px;flex-wrap:wrap;margin-top:30px;color:var(--color-ink-3);font-size:12px}.hero-trust span{display:inline-flex;align-items:center;gap:6px}.hero-trust svg{color:var(--color-teal)}.repair-showcase{position:relative;min-height:560px;padding:0 0 48px}.premium-hero-card{will-change:transform,opacity;transform:translate3d(0,var(--hero-parallax-y,0px),0)}.showcase-main{position:absolute;inset:0 0 48px 0;overflow:hidden;border-radius:24px;box-shadow:0 28px 70px rgba(24,33,31,.18)}.showcase-main img{width:100%;height:100%;object-fit:cover;display:block;animation:showcaseIn .65s ease both}.showcase-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,81,68,.02) 20%,rgba(24,33,31,.78) 100%)}.showcase-topline{position:absolute;left:24px;right:24px;top:22px;display:flex;justify-content:space-between;color:white;font:700 10px var(--font-mono);letter-spacing:.12em}.showcase-copy{position:absolute;left:26px;right:30%;bottom:27px;color:white}.showcase-label{display:inline-block;padding:6px 9px;border:1px solid rgba(255,255,255,.55);border-radius:99px;font:700 10px var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.showcase-copy h2{font-size:clamp(24px,3.3vw,45px);line-height:1.02;letter-spacing:-.04em;margin:14px 0 9px;max-width:11ch}.showcase-copy p{font-size:13px;line-height:1.5;max-width:39ch;color:rgba(255,255,255,.78);margin:0}.showcase-secondary{position:absolute;right:-15px;bottom:5px;width:32%;height:210px;border:7px solid var(--color-porcelain);background:var(--color-paper);box-shadow:0 16px 35px rgba(24,33,31,.2);transform:rotate(3deg);overflow:hidden}.showcase-secondary img{width:100%;height:100%;object-fit:cover}.showcase-secondary span{position:absolute;right:10px;bottom:8px;color:white;text-shadow:0 1px 4px rgba(0,0,0,.5);font:700 9px var(--font-mono);letter-spacing:.1em}.showcase-controls{position:absolute;left:0;right:0;bottom:3px;display:flex;align-items:center;gap:10px}.showcase-controls>button{width:34px;height:34px;border:1px solid var(--color-line-strong);border-radius:50%;background:var(--color-paper);color:var(--color-ink);display:grid;place-items:center;cursor:pointer;transition:background .2s,color .2s}.showcase-controls>button:hover{background:var(--color-teal);color:white;border-color:var(--color-teal)}.showcase-progress{display:flex;gap:6px;flex:1}.showcase-progress button{height:4px;border:0;background:rgba(24,33,31,.16);padding:0;flex:1;overflow:hidden;cursor:pointer}.showcase-progress button span{display:block;height:100%;background:var(--color-teal);transform-origin:left;transition:transform .35s ease}.showcase-play{margin-left:2px}.showcase-caption{position:absolute;right:0;bottom:-1px;margin:0;color:var(--color-ink-3);font:700 9px var(--font-mono);letter-spacing:.06em;text-transform:uppercase}.showcase-caption:before{content:'';display:inline-block;width:22px;height:1px;background:var(--color-teal);vertical-align:middle;margin:0 8px 0 0}@keyframes showcaseIn{from{opacity:.3;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}
        @media(max-width:1000px){.hero-wrap{grid-template-columns:1fr;gap:48px}.hero-headline{perspective:900px;overflow:visible;font-size:clamp(50px,9vw,74px)}.repair-showcase{width:min(100%,720px);margin:0 auto}}
        @media(max-width:650px){.repair-scene-hero{padding:112px 0 76px}.hero-wrap{width:min(var(--max),calc(100% - 36px));gap:38px}.hero-headline{perspective:900px;overflow:visible;font-size:clamp(45px,13vw,58px)}.hero-lead{font-size:16px;margin:22px 0 28px}.category-selector{gap:16px}.hero-actions{gap:15px;margin-top:32px}.hero-secondary{font-size:13px}.hero-trust{gap:10px;flex-direction:column;margin-top:24px}.repair-showcase{min-height:430px;padding-bottom:46px}.showcase-main{inset:0 0 48px 0;border-radius:18px}.showcase-topline{left:16px;right:16px;top:16px;font-size:8px}.showcase-copy{left:17px;right:20px;bottom:19px}.showcase-copy h2{font-size:29px;margin:10px 0 7px}.showcase-copy p{font-size:12px}.showcase-secondary{width:34%;height:132px;right:-3px;bottom:17px;border-width:5px}.showcase-secondary span{font-size:7px;right:6px;bottom:5px}.showcase-controls{bottom:0}.showcase-caption{display:none}}
        @media(prefers-reduced-motion:reduce){.showcase-main img{animation:none}.showcase-progress button span{transition:none}}
      `}</style>
    </section>
  );
}
