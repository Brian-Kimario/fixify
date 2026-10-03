'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ClipboardCheck, FileCheck2, Search, ShieldCheck, Wrench } from 'lucide-react';

const steps = [
  { number: '01', label: 'Describe', title: 'Start with what you can see.', description: 'A leaking sink, a dead socket, a noisy AC or an appliance that stopped mid-cycle. Everyday words are enough.', icon: Search, image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/Ha2ovwv97CHNr5m2o2zXhg.webp', alt: 'Home repair problem being inspected' },
  { number: '02', label: 'Match', title: 'The right technician sees the full context.', description: 'Fixify routes the request to an eligible professional with the problem, photos and property details already attached.', icon: ShieldCheck, image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/DHK7gQoeM3JUL5gB7vBw8e.jpg', alt: 'Professional technician inspecting a home system' },
  { number: '03', label: 'Inspect', title: 'The visit turns uncertainty into a plan.', description: 'The technician confirms what is actually wrong, explains the next step and submits a quote when more work is needed.', icon: Wrench, image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/AyFYZqcj3vTEWrifMeGyaN.jpg', alt: 'Technician carrying out a household repair' },
  { number: '04', label: 'Record', title: 'The fix stays useful after the visit.', description: 'Completion evidence, invoices and service notes become part of the property record, ready for the next repair.', icon: FileCheck2, image: 'https://files.manuscdn.com/search-media/310519663994103623/Y5q7XWbpq3HGFM26smQYF0/w4jA8jF4SYQC3cxxjFjhQH.webp', alt: 'Completed household maintenance work' },
];

export function WorkflowStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(section.querySelectorAll<HTMLElement>('[data-step]'));
    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const viewportFocus = window.innerHeight * 0.46;
      let closest = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportFocus);
        if (distance < closestDistance) { closest = index; closestDistance = distance; }
        const focus = reduced ? 1 : Math.max(0, 1 - distance / Math.max(window.innerHeight * 0.3, 180));
        item.style.setProperty('--workflow-focus', focus.toFixed(3));
      });
      if (closest !== current) { current = closest; setActiveStep(closest); }
    };
    const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const active = steps[activeStep];
  const ActiveIcon = active.icon;

  return (
    <section ref={sectionRef} id="how" className="workflow-section">
      <div className="workflow-shell">
        <div className="workflow-intro"><p className="workflow-kicker">HOW FIXIFY WORKS / IN FOUR MOVES</p><h2>From a small concern to a finished job.</h2><p>Scroll through the real service journey. Every stage is visible, every extra decision is yours, and every completed repair stays attached to the property.</p></div>
        <div className="workflow-layout">
          <div className="workflow-visual-wrap"><div className="workflow-visual"><img key={active.image} src={active.image} alt={active.alt} /><div className="workflow-visual-shade" /><div className="workflow-visual-meta"><span>FIXIFY / {active.label.toUpperCase()}</span><span>{active.number} / 04</span></div><div className="workflow-visual-caption"><span className="workflow-icon"><ActiveIcon size={18} /></span><div><strong>{active.title}</strong><span>{active.label} stage</span></div></div></div><div className="workflow-rail"><span className="workflow-rail-fill" style={{ height: `${((activeStep + 1) / steps.length) * 100}%` }} /></div></div>
          <div className="workflow-steps">{steps.map((step, index) => { const Icon = step.icon; return <article key={step.number} data-step={index} className={`workflow-step ${activeStep === index ? 'is-active' : ''}`}><div className="workflow-step-index">{step.number}</div><div className="workflow-step-body"><div className="workflow-step-label"><Icon size={15} /> {step.label}</div><h3>{step.title}</h3><p>{step.description}</p>{index === 2 && <div className="workflow-approval"><ClipboardCheck size={15} /><span>Extra work only begins after you approve the quote.</span></div>}{index === steps.length - 1 && <a href="#property" className="workflow-link">See the property record <ArrowRight size={15} /></a>}</div><span className="workflow-step-check">{activeStep > index ? <Check size={14} /> : index + 1}</span></article>; })}</div>
        </div>
      </div>
      <style jsx>{`
        .workflow-section{background:#17211f;color:white;padding:clamp(88px,10vw,132px) 0;position:relative;overflow:hidden}.workflow-section:before{content:'';position:absolute;inset:0;opacity:.17;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(to bottom,black,transparent)}.workflow-shell{width:min(var(--max),calc(100% - 48px));margin:0 auto;position:relative;z-index:1}.workflow-intro{max-width:690px;margin-bottom:70px}.workflow-kicker{color:#79b8a7;font:700 10px var(--font-mono);letter-spacing:.13em;margin:0 0 16px}.workflow-intro h2{font-size:clamp(42px,5vw,67px);letter-spacing:-.055em;line-height:.98;margin:0;max-width:11ch}.workflow-intro>p:last-child{color:rgba(255,255,255,.58);font-size:16px;line-height:1.65;max-width:53ch;margin:23px 0 0}.workflow-layout{display:grid;grid-template-columns:minmax(360px,.86fr) minmax(0,1.14fr);gap:clamp(52px,8vw,110px);align-items:start}.workflow-visual-wrap{position:sticky;top:110px;height:510px;display:flex;gap:17px}.workflow-visual{position:relative;overflow:hidden;border-radius:22px;flex:1;background:#24332f;box-shadow:0 22px 70px rgba(0,0,0,.28)}.workflow-visual img{width:100%;height:100%;object-fit:cover;display:block;animation:workflowImageIn .65s ease both}.workflow-visual-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(23,33,31,.02) 30%,rgba(23,33,31,.8) 100%)}.workflow-visual-meta{position:absolute;top:20px;left:20px;right:20px;display:flex;justify-content:space-between;color:rgba(255,255,255,.74);font:700 10px var(--font-mono);letter-spacing:.12em}.workflow-visual-caption{position:absolute;left:20px;right:20px;bottom:21px;display:flex;align-items:center;gap:11px}.workflow-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#e2eee9;color:#0d5144}.workflow-visual-caption strong{display:block;font-size:15px;line-height:1.2}.workflow-visual-caption>div>span{display:block;color:rgba(255,255,255,.6);font-size:11px;margin-top:4px}.workflow-rail{width:2px;height:100%;background:rgba(255,255,255,.15);position:relative}.workflow-rail-fill{position:absolute;left:0;top:0;width:100%;background:#79b8a7;transition:height .45s ease}.workflow-steps{border-top:1px solid rgba(255,255,255,.16)}.workflow-step{position:relative;display:grid;grid-template-columns:44px 1fr 28px;gap:17px;padding:24px 0;border-bottom:1px solid rgba(255,255,255,.13);opacity:calc(.3 + (var(--workflow-focus, 0) * .7));transition:opacity .25s ease,transform .25s ease}.workflow-step.is-active{opacity:1;transform:translateX(6px)}.workflow-step-index{font:700 11px var(--font-mono);color:#79b8a7;padding-top:3px}.workflow-step-label{display:flex;align-items:center;gap:6px;color:#79b8a7;font:700 10px var(--font-mono);letter-spacing:.1em;text-transform:uppercase}.workflow-step h3{font-size:24px;line-height:1.05;letter-spacing:-.03em;margin:9px 0 7px}.workflow-step p{font-size:14px;line-height:1.6;color:rgba(255,255,255,.56);max-width:46ch;margin:0}.workflow-step-check{width:27px;height:27px;border:1px solid rgba(255,255,255,.28);border-radius:50%;display:grid;place-items:center;color:rgba(255,255,255,.65);font:700 11px var(--font-mono)}.workflow-step.is-active .workflow-step-check,.workflow-step:has(~ .is-active) .workflow-step-check{border-color:#79b8a7;color:#79b8a7}.workflow-approval{display:flex;align-items:center;gap:8px;color:#b9d8cf;font-size:12px;margin-top:15px}.workflow-link{display:inline-flex;align-items:center;gap:7px;color:#b9d8cf;font-size:13px;font-weight:700;text-decoration:none;margin-top:15px}.workflow-link:hover{color:white}@keyframes workflowImageIn{from{opacity:.25;transform:scale(1.045)}to{opacity:1;transform:scale(1)}}
        @media(max-width:900px){.workflow-shell{width:min(var(--max),calc(100% - 36px))}.workflow-layout{grid-template-columns:1fr;gap:34px}.workflow-visual-wrap{position:sticky;top:80px;height:360px;z-index:2}.workflow-intro{margin-bottom:45px}.workflow-step{opacity:.72}.workflow-step.is-active{transform:none;opacity:1}}
        @media(max-width:600px){.workflow-section{padding:76px 0}.workflow-intro h2{font-size:43px}.workflow-intro>p:last-child{font-size:15px}.workflow-visual-wrap{height:330px;gap:11px}.workflow-visual{border-radius:17px}.workflow-visual-meta{left:14px;right:14px;top:14px;font-size:8px}.workflow-visual-caption{left:14px;right:14px;bottom:15px}.workflow-step{grid-template-columns:31px 1fr 25px;gap:10px;padding:22px 0}.workflow-step h3{font-size:21px}.workflow-step p{font-size:13px}.workflow-step.is-active{transform:none}}
        @media(prefers-reduced-motion:reduce){.workflow-visual img{animation:none}.workflow-step,.workflow-rail-fill{transition:none}}
      `}</style>
    </section>
  );
}
