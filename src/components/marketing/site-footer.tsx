import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="footer" id="footer">
      <div className="wrap">
        <div className="foot-grid">
          {/* Brand Column */}
          <div>
            <Link className="brand" href="#top">
              <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d="M8 30 24 13l16 17M24 13 15 35M24 13l9 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle className="node" cx="24" cy="13" r="3.6" />
              </svg>
              <span>Fixify</span>
            </Link>
            <p className="foot-copy">
              Property maintenance, structured from the first message to the final record.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="foot-title">PRODUCT</p>
            <Link href="#services">Services</Link>
            <Link href="#how">How it works</Link>
            <Link href="/property">Property record</Link>
          </div>

          {/* Network */}
          <div>
            <p className="foot-title">NETWORK</p>
            <Link href="/professionals">For professionals</Link>
            <Link href="/professionals">For professionals</Link>
            <Link href="/pro">Professional workspace</Link>
          </div>

          {/* Help */}
          <div>
            <p className="foot-title">HELP</p>
            <Link href="/help">Help centre</Link>
            <Link href="/help#trust">Trust & safety</Link>
            <Link href="/help#contact">Contact Fixify</Link>
          </div>
        </div>

        <div className="foot-bottom">
          <span>FIXIFY / PUBLIC ENTRY</span>
          <span>REFERENCE UI / REV 3</span>
        </div>
      </div>
    </footer>
  );
}
