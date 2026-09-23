import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-panel mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center">
                <span className="font-display font-bold text-dark text-sm">F</span>
              </div>
              <span className="font-display font-bold text-ink">Fixify</span>
            </div>
            <p className="text-line text-sm">
              Property service, properly managed.
            </p>
          </div>

          {/* Customer */}
          <div>
            <h3 className="font-display font-bold text-ink mb-4">Customers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services" className="text-line hover:text-ink transition-colors text-sm">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-line hover:text-ink transition-colors text-sm">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-line hover:text-ink transition-colors text-sm">
                  Help
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-line hover:text-ink transition-colors text-sm">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          {/* Professional */}
          <div>
            <h3 className="font-display font-bold text-ink mb-4">Professionals</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/professionals" className="text-line hover:text-ink transition-colors text-sm">
                  Become a professional
                </Link>
              </li>
              <li>
                <Link href="/pro/login" className="text-line hover:text-ink transition-colors text-sm">
                  Professional sign in
                </Link>
              </li>
              <li>
                <Link href="/pro/onboarding" className="text-line hover:text-ink transition-colors text-sm">
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-bold text-ink mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-line hover:text-ink transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/" className="text-line hover:text-ink transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/" className="text-line hover:text-ink transition-colors text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/" className="text-line hover:text-ink transition-colors text-sm">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <p className="text-line text-sm text-center">
            © 2026 Fixify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
