'use client';

import Link from 'next/link';
import { Symbol } from '@/components/brand/Symbol';

export function SiteFooter() {
  return (
    <footer id="footer" className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="brand" href="#top">
              <Symbol size="md" className="brand-mark" />
              <span>Fixify</span>
            </Link>
            <p className="foot-copy">Property maintenance, structured from the first message to the final record.</p>
          </div>

          <div>
            <p className="foot-title">PRODUCT</p>
            <Link href="#services">Services</Link>
            <Link href="#how">How it works</Link>
            <Link href="#property">Property record</Link>
          </div>

          <div>
            <p className="foot-title">NETWORK</p>
            <Link href="#professionals">For professionals</Link>
            <Link href="/professional">Professional space</Link>
            <Link href="/auth/login?next=/professional">Professional sign in</Link>
          </div>

          <div>
            <p className="foot-title">SUPPORT</p>
            <Link href="#footer">Help centre</Link>
            <Link href="#footer">Trust & safety</Link>
            <Link href="mailto:hello@fixify.example">Contact Fixify</Link>
          </div>
        </div>

        <div className="foot-bottom">
          <span>FIXIFY / REFERENCE UI V4</span>
          <span>LIGHT-FIRST · DOMAIN-SPECIFIC · PURPOSEFUL MOTION</span>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: var(--color-ink);
          color: var(--color-paper);
          padding: clamp(80px, 10vw, 96px) 0 clamp(28px, 4vw, 40px);
          border-top: 1px solid var(--color-ink-2);
        }

        .wrap {
          width: min(var(--max), calc(100% - 48px));
          margin: 0 auto;
        }

        .foot-grid {
          display: grid;
          grid-template-columns: 1.6fr repeat(3, 1fr);
          gap: 36px;
          margin-bottom: clamp(40px, 6vw, 64px);
        }

        .foot-grid > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--color-paper);
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.015em;
          transition: opacity 150ms;
          width: fit-content;
        }

        .brand:hover {
          opacity: 0.8;
        }

        .brand-mark {
          width: 28px;
          height: 28px;
          color: var(--color-teal);
          stroke: currentColor;
          stroke-width: 3.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .brand-mark .node {
          fill: currentColor;
          stroke: none;
        }

        .foot-copy {
          font-size: 13px;
          color: var(--color-ink-3);
          line-height: 1.6;
          margin: 0;
        }

        .foot-title {
          font: 700 10px var(--font-mono);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-paper);
          margin: 0 0 10px 0;
        }

        .foot-grid > div:not(:first-child) {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .foot-grid a {
          font-size: 13px;
          color: var(--color-ink-3);
          text-decoration: none;
          transition: color 150ms;
        }

        .foot-grid a:hover {
          color: var(--color-paper);
        }

        .foot-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: clamp(20px, 4vw, 24px);
          border-top: 1px solid var(--color-ink-2);
          font-size: 10px;
          color: var(--color-ink-3);
          font: 600 10px var(--font-mono);
          letter-spacing: 0.08em;
        }

        @media (max-width: 768px) {
          .foot-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }

          .foot-grid > div:first-child {
            grid-column: 1 / -1;
          }

          .foot-bottom {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
