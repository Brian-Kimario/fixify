'use client';

import Link from 'next/link';
import { Symbol } from '@/components/brand/Symbol';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="footer">
      <div className="wrap">
        <div className="foot-grid">
          {/* Brand Column */}
          <div>
            <Link className="brand" href="/">
              <Symbol size="md" className="brand-mark" />
              <span>Fixify</span>
            </Link>
            <p className="foot-copy">Property maintenance marketplace connecting customers with verified professionals.</p>
            <div className="foot-social">
              <a href="https://twitter.com" className="social-link" aria-label="Twitter">
                𝕏
              </a>
              <a href="https://linkedin.com" className="social-link" aria-label="LinkedIn">
                in
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <p className="foot-title">PRODUCT</p>
            <Link href="/">How it works</Link>
            <Link href="/">Find services</Link>
            <Link href="/professional">For professionals</Link>
            <Link href="/customer">Get started</Link>
          </div>

          {/* Support & Legal Column */}
          <div>
            <p className="foot-title">SUPPORT</p>
            <Link href="/">Contact us</Link>
            <a href="mailto:support@fixify.com">Email support</a>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </div>

          {/* Company Column */}
          <div>
            <p className="foot-title">COMPANY</p>
            <p className="foot-link-label">About Fixify</p>
            <p className="foot-info">Fixify is a trusted marketplace for property maintenance services. We connect verified professionals with customers seeking reliable home repair and maintenance solutions.</p>
            <p className="foot-link-label mt-4">Headquarters</p>
            <p className="foot-info">Fixify Technologies<br />India</p>
          </div>
        </div>

        <div className="foot-divider"></div>

        <div className="foot-bottom">
          <div className="foot-bottom-left">
            <span className="foot-copyright">© {currentYear} Fixify. All rights reserved.</span>
            <span className="foot-status">Status: Production Ready</span>
          </div>
          <div className="foot-bottom-right">
            <span className="foot-contact">
              For inquiries: <a href="mailto:support@fixify.com">support@fixify.com</a>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #0f1419;
          color: #e8ebed;
          padding: clamp(80px, 10vw, 96px) 0 clamp(28px, 4vw, 40px);
          border-top: 1px solid #1e2330;
        }

        .wrap {
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
        }

        .foot-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1.2fr 1.4fr;
          gap: 48px;
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
          color: #ffffff;
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
          color: #00b896;
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
          color: #a8aeb5;
          line-height: 1.6;
          margin: 0;
        }

        .foot-social {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-link {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #2a3140;
          border-radius: 6px;
          color: #a8aeb5;
          text-decoration: none;
          font-weight: 600;
          font-size: 12px;
          transition: all 200ms;
        }

        .social-link:hover {
          border-color: #00b896;
          color: #00b896;
          background: rgba(0, 184, 150, 0.05);
        }

        .foot-title {
          font: 700 11px 'Monaco', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0 0 12px 0;
          opacity: 0.95;
        }

        .foot-grid > div:not(:first-child) {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .foot-grid a {
          font-size: 13px;
          color: #a8aeb5;
          text-decoration: none;
          transition: color 150ms;
          line-height: 1.5;
        }

        .foot-grid a:hover {
          color: #00b896;
        }

        .foot-link-label {
          font-size: 12px;
          color: #ffffff;
          font-weight: 600;
          margin-top: 12px;
          margin-bottom: 4px;
        }

        .foot-info {
          font-size: 12px;
          color: #a8aeb5;
          line-height: 1.6;
          margin: 0;
        }

        .foot-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #1e2330, transparent);
          margin-bottom: 24px;
        }

        .foot-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: clamp(20px, 4vw, 24px);
          font-size: 11px;
          color: #6b7280;
          letter-spacing: 0.06em;
        }

        .foot-bottom-left {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .foot-bottom-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .foot-copyright {
          color: #6b7280;
          font-size: 11px;
        }

        .foot-status {
          background: rgba(0, 184, 150, 0.1);
          color: #00b896;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .foot-contact {
          color: #a8aeb5;
          font-size: 11px;
        }

        .foot-contact a {
          color: #00b896;
          text-decoration: none;
          transition: opacity 150ms;
        }

        .foot-contact a:hover {
          opacity: 0.8;
        }

        @media (max-width: 1024px) {
          .foot-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px;
          }

          .foot-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .foot-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .foot-grid > div:first-child {
            grid-column: auto;
          }

          .foot-bottom {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .foot-bottom-left,
          .foot-bottom-right {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
        }
      `}</style>
    </footer>
  );
}
