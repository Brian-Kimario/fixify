'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  Fan,
  Lightbulb,
  Refrigerator,
  Wrench,
} from 'lucide-react';

const services = [
  {
    slug: 'electrical',
    index: '01',
    name: 'Electrical',
    desc: 'Sockets, lights, wiring faults, breakers and household electrical work.',
    icon: Lightbulb,
    tint: 'gold',
  },
  {
    slug: 'plumbing',
    index: '02',
    name: 'Plumbing',
    desc: 'Leaks, blockages, fittings, drainage and water-pressure problems.',
    icon: Wrench,
    tint: 'blue',
  },
  {
    slug: 'ac-cooling',
    index: '03',
    name: 'AC & cooling',
    desc: 'Cooling issues, servicing, installation checks and related repairs.',
    icon: Fan,
    tint: 'mint',
  },
  {
    slug: 'appliances',
    index: '04',
    name: 'Appliance repair',
    desc: 'Washing machines, refrigerators, ovens and other household equipment.',
    icon: Refrigerator,
    tint: 'rose',
  },
] as const;

export function ServiceCategoryGrid() {
  return (
    <section className="service-section" id="services">
      <div className="service-wrap">
        <div className="service-heading" data-reveal>
          <div>
            <p className="service-kicker">Find the right starting point</p>
            <h2>Browse by service type</h2>
          </div>
          <p className="service-intro">
            Not sure about the category? Start with your problem description instead.
          </p>
        </div>

        <div className="service-grid" data-stagger>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.slug}
                href={`/customer?service=${service.slug}#intake`}
                className="service-card"
                style={{ transitionDelay: `${(Number(service.index) - 1) * 100}ms` }}
              >
                <div className="service-card-top">
                  <span className={`service-icon service-icon-${service.tint}`} aria-hidden="true">
                    <Icon size={23} strokeWidth={1.8} />
                  </span>
                  <span className="service-number">{service.index}</span>
                </div>
                <div className="service-card-copy">
                  <h3>{service.name}</h3>
                  <p>{service.desc}</p>
                </div>
                <span className="service-arrow" aria-hidden="true">
                  <ArrowUpRight size={19} strokeWidth={2} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .service-section {
          background: var(--color-paper);
          border-top: 1px solid var(--color-line);
          padding: clamp(72px, 8vw, 112px) 0 clamp(80px, 9vw, 128px);
        }
        .service-wrap {
          width: min(var(--max), calc(100% - 48px));
          margin: 0 auto;
        }
        .service-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 48px;
          margin-bottom: 44px;
        }
        .service-kicker {
          color: var(--color-teal);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          line-height: 1.3;
          margin: 0 0 14px;
          text-transform: uppercase;
        }
        .service-heading h2 {
          color: var(--color-ink);
          font-size: clamp(36px, 4.2vw, 58px);
          font-weight: 700;
          letter-spacing: -0.045em;
          line-height: 1.02;
          margin: 0;
        }
        .service-intro {
          color: var(--color-ink-3);
          font-size: 15px;
          line-height: 1.65;
          margin: 0 0 4px;
          max-width: 34ch;
        }
        .service-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .service-card {
          background: var(--color-porcelain);
          border: 1px solid var(--color-line);
          border-radius: 18px;
          color: inherit;
          display: flex;
          flex-direction: column;
          min-height: 286px;
          overflow: hidden;
          padding: 22px 20px 19px;
          position: relative;
          text-decoration: none;
          transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }
        .service-card::after {
          background: var(--color-teal);
          bottom: 0;
          content: '';
          height: 3px;
          left: 0;
          position: absolute;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 220ms ease;
          width: 100%;
        }
        .service-card:hover,
        .service-card:focus-visible {
          background: var(--color-paper);
          border-color: var(--color-line-strong);
          box-shadow: 0 16px 34px rgba(24, 33, 31, 0.09);
          outline: none;
          transform: translateY(-5px);
        }
        .service-card:hover::after,
        .service-card:focus-visible::after {
          transform: scaleX(1);
        }
        .service-card-top {
          align-items: flex-start;
          display: flex;
          justify-content: space-between;
        }
        .service-icon {
          align-items: center;
          border-radius: 12px;
          display: inline-flex;
          height: 48px;
          justify-content: center;
          width: 48px;
        }
        .service-icon-gold { background: #f5e8c8; color: #8a5f15; }
        .service-icon-blue { background: #dcebf0; color: #286279; }
        .service-icon-mint { background: #dceee7; color: #176b5b; }
        .service-icon-rose { background: #f2dfd9; color: #984a38; }
        .service-number {
          color: var(--color-ink-4);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding-top: 5px;
        }
        .service-card-copy {
          margin-top: auto;
          padding-right: 8px;
        }
        .service-card h3 {
          color: var(--color-ink);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 10px;
        }
        .service-card p {
          color: var(--color-ink-3);
          font-size: 13px;
          line-height: 1.58;
          margin: 0;
        }
        .service-arrow {
          align-items: center;
          border: 1px solid var(--color-line-strong);
          border-radius: 50%;
          color: var(--color-teal);
          display: inline-flex;
          height: 34px;
          justify-content: center;
          margin-top: 22px;
          transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
          width: 34px;
        }
        .service-card:hover .service-arrow,
        .service-card:focus-visible .service-arrow {
          background: var(--color-teal);
          border-color: var(--color-teal);
          color: white;
        }
        @media (max-width: 900px) {
          .service-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .service-card { min-height: 250px; }
        }
        @media (max-width: 620px) {
          .service-wrap { width: min(100% - 36px, 520px); }
          .service-heading { align-items: flex-start; flex-direction: column; gap: 16px; margin-bottom: 30px; }
          .service-intro { max-width: 42ch; }
          .service-grid { gap: 10px; grid-template-columns: 1fr; }
          .service-card { min-height: 0; padding: 18px; }
          .service-card-copy { margin-top: 28px; }
        }
        .service-grid[data-stagger][data-visible="true"] > *:nth-child(1) { transition-delay: 0ms !important; }
        .service-grid[data-stagger][data-visible="true"] > *:nth-child(2) { transition-delay: 100ms !important; }
        .service-grid[data-stagger][data-visible="true"] > *:nth-child(3) { transition-delay: 200ms !important; }
        .service-grid[data-stagger][data-visible="true"] > *:nth-child(4) { transition-delay: 300ms !important; }
        @media (prefers-reduced-motion: reduce) {
          .service-card,
          .service-card::after,
          .service-arrow { transition: none; }
        }
      `}</style>
    </section>
  );
}
