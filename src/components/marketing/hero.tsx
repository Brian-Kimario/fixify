'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="hero" style={{ marginTop: '88px' }}>
      <div className="wrap hero-grid">
        {/* Left - Copy */}
        <div className="hero-copy">
          <p className="eyebrow reveal in">PROPERTY CARE / MADE CLEAR</p>
          <h1 className="reveal in delay1">
            <span className="word"><i>Your problem.</i></span>
            <br />
            <span className="word"><i><em>Fixed properly.</em></i></span>
          </h1>
          <p className="hero-lead reveal in delay1">
            Tell Fixify what is happening at your property. Start with the problem—not the trade name—and we help turn it into a clear service path.
          </p>
          <div className="hero-cta reveal in delay2">
            <Link href="/customer" className="btn btn-primary magnet">
              Describe a problem <span>↗</span>
            </Link>
            <Link href="#services" className="btn btn-ghost">
              Browse services
            </Link>
          </div>
          <div className="hero-note reveal in delay3">
            <span>Verified professionals</span>
            <span>Clear approval before extra work</span>
            <span>Maintenance history</span>
          </div>
        </div>

        {/* Right - Visual */}
        <div className="hero-visual reveal in delay1">
          <div className="hero-photo tilt">
            <img 
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1700&q=88" 
              alt="Warm modern home interior with natural light"
            />
            <div className="photo-caption">
              <strong>A home worth taking care of.</strong>
              Fixify keeps the work visible.
            </div>
          </div>
          <div className="hero-detail">
            <div className="detail-top">
              <span className="detail-title">Example request</span>
              <span className="status">UNDERSTOOD</span>
            </div>
            <div className="detail-quote">"The kitchen tap keeps dripping even when it is fully closed."</div>
            <div className="detail-meta">
              <div className="meta-box">
                <span>Likely service</span>
                <strong>Plumbing</strong>
              </div>
              <div className="meta-box">
                <span>Next step</span>
                <strong>Choose a time</strong>
              </div>
            </div>
          </div>
          <div className="photo-chip tilt">
            <img 
              src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=700&q=86" 
              alt="Professional electrical maintenance work"
            />
          </div>
          <div className="orbit-line" aria-hidden="true"></div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          padding: 148px 0 92px;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(circle at 84% 22%, rgba(65, 107, 132, 0.11), transparent 22%),
            radial-gradient(circle at 11% 10%, rgba(23, 107, 91, 0.11), transparent 20%);
          pointer-events: none;
        }

        .blueprint {
          position: absolute;
          inset: 0;
          opacity: 0.45;
          background-image:
            linear-gradient(rgba(24, 33, 31, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(24, 33, 31, 0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
          animation: gridDrift 20s linear infinite;
        }

        @keyframes gridDrift {
          to {
            background-position: 42px 0, 0 42px;
          }
        }

        .wrap {
          width: min(var(--max), calc(100% - 48px));
          margin: 0 auto;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(520px, 1.1fr);
          gap: 70px;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .hero-copy h1 {
          font-size: clamp(58px, 6.2vw, 84px);
          max-width: 10.5ch;
          margin-top: 18px;
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 700;
        }

        .hero-copy h1 em {
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
          color: var(--color-teal);
          letter-spacing: -0.04em;
        }

        .hero-lead {
          font-size: 18px;
          line-height: 1.58;
          color: var(--color-ink-3);
          max-width: 53ch;
          margin-top: 24px;
        }

        .hero-cta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .hero-note {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 26px;
          color: var(--color-ink-4);
          font-size: 12px;
        }

        .hero-note span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hero-note span::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-teal);
        }

        .hero-visual {
          position: relative;
          min-height: 560px;
        }

        .hero-photo {
          position: absolute;
          right: 0;
          top: 0;
          width: 78%;
          height: 480px;
          border-radius: 34px;
          overflow: hidden;
          box-shadow: var(--shadow);
          background: #d9ded8;
        }

        .hero-photo img {
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-photo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(24, 33, 31, 0.03), rgba(24, 33, 31, 0.28));
        }

        .photo-caption {
          position: absolute;
          left: 24px;
          bottom: 22px;
          color: white;
          z-index: 2;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: var(--font-mono);
          opacity: 0.9;
        }

        .photo-caption strong {
          display: block;
          font-family: var(--font-sans);
          font-size: 18px;
          letter-spacing: -0.02em;
          text-transform: none;
          margin-bottom: 4px;
        }

        .hero-detail {
          position: absolute;
          left: 0;
          bottom: 26px;
          width: 58%;
          border: 1px solid rgba(255, 255, 255, 0.62);
          background: rgba(255, 254, 250, 0.91);
          backdrop-filter: blur(14px);
          border-radius: 20px;
          padding: 16px;
          box-shadow: var(--shadowSoft);
        }

        .detail-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .detail-title {
          font-size: 13px;
          font-weight: 700;
        }

        .status {
          font: 650 10px var(--font-mono);
          padding: 6px 8px;
          border-radius: 99px;
          background: var(--color-teal-soft);
          color: var(--color-teal-deep);
        }

        .detail-quote {
          font: 400 20px var(--font-serif);
          margin-top: 12px;
          max-width: 18ch;
        }

        .detail-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 14px;
        }

        .meta-box {
          background: rgba(24, 33, 31, 0.035);
          border-radius: 10px;
          padding: 9px;
        }

        .meta-box span {
          display: block;
          color: var(--color-ink-4);
          font: 600 9px var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .meta-box strong {
          display: block;
          margin-top: 3px;
          font-size: 11px;
        }

        .orbit-line {
          position: absolute;
          right: 4%;
          top: -6%;
          width: 70%;
          height: 70%;
          border: 1px solid rgba(23, 107, 91, 0.15);
          border-radius: 50%;
          transform: rotate(-11deg);
          pointer-events: none;
        }

        .orbit-line::before {
          content: '';
          position: absolute;
          left: 18%;
          top: -4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--color-teal);
          box-shadow: 0 0 0 8px rgba(23, 107, 91, 0.08);
          animation: signalTravel 7s linear infinite;
        }

        @keyframes signalTravel {
          0% { left: 18%; top: -4px; }
          35% { left: 94%; top: 22%; }
          65% { left: 68%; top: 96%; }
          100% { left: 18%; top: -4px; }
        }

        .photo-chip {
          position: absolute;
          right: 5%;
          bottom: -1px;
          width: 126px;
          height: 154px;
          border: 4px solid var(--color-porcelain);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(24, 33, 31, 0.18);
          transform: rotate(3.5deg);
          transition: transform 0.5s var(--ease);
        }

        .photo-chip img {
          height: 100%;
          object-fit: cover;
        }

        .hero-visual:hover .photo-chip {
          transform: rotate(-1deg) translateY(-6px);
        }

        .tilt {
          perspective: 1000px;
        }

        .reveal {
          opacity: 0;
          animation: revealUp 0.75s var(--ease) forwards;
        }

        .reveal.in {
          opacity: 1;
          animation: none;
        }

        .reveal.delay1 {
          animation-delay: 0.08s;
        }

        .reveal.delay2 {
          animation-delay: 0.16s;
        }

        .reveal.delay3 {
          animation-delay: 0.24s;
        }

        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 650;
          transition: transform 0.24s, background 0.24s, border-color 0.24s, box-shadow 0.24s;
          text-decoration: none;
          cursor: pointer;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          background: var(--color-teal);
          color: white;
          box-shadow: 0 10px 24px rgba(23, 107, 91, 0.16);
        }

        .btn-primary:hover {
          background: var(--color-teal-deep);
          box-shadow: 0 15px 30px rgba(23, 107, 91, 0.22);
        }

        .btn-ghost {
          border-color: var(--color-line-strong);
          background: rgba(255, 254, 250, 0.58);
        }

        .btn-ghost:hover {
          background: var(--color-paper);
          border-color: #B8C3BC;
        }

        .magnet {
          position: relative;
        }

        .magnet:hover {
          position: relative;
        }

        @media (max-width: 1000px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .hero-copy {
            max-width: 720px;
          }

          .hero-visual {
            min-height: 560px;
          }

          .hero-photo {
            width: 84%;
          }

          .hero-detail {
            width: 61%;
          }
        }

        @media (max-width: 650px) {
          .hero {
            padding: 118px 0 70px;
          }

          .hero-copy h1 {
            font-size: clamp(46px, 14vw, 68px);
          }

          .hero-lead {
            font-size: 16px;
          }

          .hero-visual {
            min-height: 430px;
          }

          .hero-photo {
            width: 94%;
            height: 350px;
            border-radius: 24px;
          }

          .hero-detail {
            width: 82%;
            bottom: 8px;
            padding: 14px;
            border-radius: 16px;
          }

          .detail-quote {
            font-size: 18px;
          }

          .photo-chip {
            width: 96px;
            height: 118px;
            right: 0;
          }

          .orbit-line {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-line::before,
          .reveal,
          .btn {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
