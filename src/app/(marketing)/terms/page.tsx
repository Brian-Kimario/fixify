import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Fixify',
  description: 'Fixify marketplace terms of service for customers and service professionals',
  openGraph: {
    title: 'Terms of Service | Fixify',
    description: 'Fixify marketplace terms of service',
    url: '/terms',
    type: 'website',
  },
};

const LAST_UPDATED = 'October 4, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink mb-2">Terms of Service</h1>
          <p className="text-line">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Provisional Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-900">
            ⚠️ <strong>This policy is provisional</strong> and marked for legal review. 
            It will be reviewed and updated by a qualified legal professional before production deployment.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">1. Fixify's Role as a Marketplace</h2>
            <p className="text-line">
              Fixify is a digital marketplace platform that connects customers with independent service professionals. 
              Fixify does not directly perform services, provide labor, or employ service professionals. 
              Instead, Fixify facilitates transactions between customers and professionals who operate as independent contractors.
            </p>
            <p className="text-line">
              When you use Fixify, you are entering into agreements directly with service professionals, not with Fixify.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">2. Customer Responsibilities</h2>
            <p className="text-line">As a customer using Fixify, you agree to:</p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li>Provide accurate, complete, and truthful information in service requests</li>
              <li>Describe services needed with sufficient detail for professionals to provide accurate quotes</li>
              <li>Disclose any hazards, obstacles, or property access limitations</li>
              <li>Grant professionals safe and reasonable access to your property</li>
              <li>Provide accurate scheduling and location information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage professionals through channels outside of Fixify to avoid platform protections</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">3. Professional Responsibilities</h2>
            <p className="text-line">Service professionals using Fixify agree to:</p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li>Provide truthful information about qualifications, licenses, and experience</li>
              <li>Perform services in a professional and workmanlike manner</li>
              <li>Comply with all applicable federal, state, and local laws</li>
              <li>Obtain all necessary licenses and insurance required for their trade</li>
              <li>Treat customer property with respect and care</li>
              <li>Provide transparent pricing and deliver quoted work as agreed</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">4. Service Lifecycle</h2>
            <p className="text-line">Typical service requests follow this process:</p>
            <ol className="list-decimal list-inside text-line space-y-2">
              <li><strong>Request:</strong> Customer submits a service request with details and photos</li>
              <li><strong>Quote:</strong> Professional provides an estimate for the work</li>
              <li><strong>Approval:</strong> Customer reviews and approves the quote</li>
              <li><strong>Acceptance:</strong> Professional accepts the job</li>
              <li><strong>Execution:</strong> Professional completes the work at the scheduled time</li>
              <li><strong>Completion:</strong> Customer confirms work is complete and processes payment</li>
            </ol>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">5. Cancellation and Refunds</h2>
            <p className="text-line">
              Our refund policy is detailed in the <a href="/refund-policy" className="text-teal underline">Refund Policy</a>. 
              Briefly:
            </p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li>Cancel before professional acceptance: 100% refund</li>
              <li>Cancel after acceptance, before work starts: 100% refund</li>
              <li>Work already in progress: case-by-case review for refunds</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">6. Liability and Warranties</h2>
            <p className="text-line text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <strong>[PROVISIONAL — Pending Legal Review]</strong> This section requires review by a qualified legal professional.
            </p>
            <p className="text-line">
              Fixify facilitates marketplace interactions but does not directly perform services. 
              Responsibility for the quality, workmanship, and outcomes of services rests solely with the service professional. 
              Customers should verify professional credentials and qualifications before engaging services.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">7. Governing Law</h2>
            <p className="text-line text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-sm mb-3">
              <strong>[PROVISIONAL — Pending Legal Review]</strong> Jurisdiction to be confirmed based on company registration.
            </p>
            <p className="text-line">
              These terms are governed by the laws of <strong>India</strong>, without regard to conflicts of law principles.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">8. Dispute Resolution</h2>
            <p className="text-line text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <strong>[PROVISIONAL — Pending Legal Review]</strong> Detailed dispute resolution procedures to be added.
            </p>
            <p className="text-line">
              If a dispute arises between a customer and professional, Fixify may assist with mediation. 
              Unresolved disputes may be pursued through applicable legal channels.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">9. Professional Verification</h2>
            <p className="text-line">
              Fixify maintains a verification program for service professionals. Verification is not a guarantee of competence 
              but indicates that professionals have submitted identity documentation and background information. 
              Customers should still verify credentials and qualifications independently.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">10. Changes to These Terms</h2>
            <p className="text-line">
              Fixify reserves the right to modify these terms at any time. Changes will be effective when posted. 
              Continued use of the platform after changes are posted constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-line pt-6 mt-8">
            <h2 className="text-2xl font-bold text-ink mb-3">Questions?</h2>
            <p className="text-line">
              If you have questions about these terms, please contact us at{' '}
              <a href="mailto:support@fixify.com" className="text-teal underline">
                support@fixify.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer Notice */}
        <div className="mt-12 pt-8 border-t border-line/20 text-sm text-line text-center">
          <p>This page was last updated on {LAST_UPDATED}</p>
          <p className="text-xs text-line/60 mt-2">
            Status: Provisional and marked for legal review
          </p>
        </div>
      </div>
    </div>
  );
}
