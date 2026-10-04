import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Fixify',
  description: 'Fixify refund and cancellation policy for customers and professionals',
  openGraph: {
    title: 'Refund Policy | Fixify',
    description: 'Fixify Refund and Cancellation Policy',
    url: '/refund-policy',
    type: 'website',
  },
};

const LAST_UPDATED = 'October 4, 2026';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink mb-2">Refund and Cancellation Policy</h1>
          <p className="text-line">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Provisional Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-900">
            ⚠️ <strong>This policy is provisional</strong> and marked for legal review. 
            It will be reviewed and updated by a qualified legal professional before production deployment.
            Some rules are marked provisional pending operational data.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">1. Overview</h2>
            <p className="text-line">
              This refund policy outlines the terms under which customers and professionals can request cancellations 
              and refunds for services on the Fixify platform. Our goal is to be fair to all parties while protecting customers.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">2. Customer Cancellation Before Professional Acceptance</h2>
            <p className="text-line"><strong>Scenario:</strong> Customer submits request → professional has not yet accepted</p>
            <p className="text-line"><strong>Refund:</strong> 100% of any payment made</p>
            <p className="text-line"><strong>Processing time:</strong> Full refund to original payment method</p>
            <p className="text-line">
              <strong>Rationale:</strong> Customer can cancel at any point before a professional commits to the job.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">3. Customer Cancellation After Professional Acceptance, Before Work Starts</h2>
            <p className="text-line"><strong>Scenario:</strong> Professional has accepted job → work has not yet begun</p>
            <p className="text-line"><strong>Refund:</strong> 100% of payment</p>
            <p className="text-line"><strong>Processing time:</strong> 5-7 business days</p>
            <p className="text-line text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <strong>[PROVISIONAL]</strong> This 100% refund rule is provisional pending 3-6 months of operational data. 
              Once Fixify has sufficient data on professional cancellation patterns and customer behavior, 
              cancellation penalties may be introduced to protect professional earnings.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">4. Professional Cancellation</h2>
            <p className="text-line"><strong>Scenario:</strong> Professional accepts job then cancels before work starts</p>
            <p className="text-line"><strong>Customer refund:</strong> 100% of payment</p>
            <p className="text-line"><strong>Professional impact:</strong> Cancellation recorded in professional's history for tracking</p>
            <p className="text-line">
              <strong>Rationale:</strong> Customer is fully protected. Professional cancellations are tracked 
              to identify patterns of unreliable behavior.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">5. Professional No-Show</h2>
            <p className="text-line"><strong>Scenario:</strong> Professional fails to arrive at scheduled time</p>
            <p className="text-line"><strong>Customer refund:</strong> 100% of payment</p>
            <p className="text-line"><strong>Professional impact:</strong> No-show recorded and may affect professional rating/availability</p>
            <p className="text-line">
              <strong>Rationale:</strong> Customer is protected from wasted time and resources.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">6. Work Already Started — Case-by-Case Review</h2>
            <p className="text-line">
              <strong>Scenario:</strong> Customer requests refund or cancellation after work has begun
            </p>
            <p className="text-line">
              <strong>Refund:</strong> Subject to case-by-case review considering:
            </p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li>Percentage of work completed</li>
              <li>Quality of work performed</li>
              <li>Reason for cancellation (customer satisfaction issue, change of plans, etc.)</li>
              <li>Photographic/documentary evidence</li>
              <li>Professional's account history and reliability</li>
              <li>Actual costs incurred by professional</li>
            </ul>
            <p className="text-line mt-4">
              <strong>Processing:</strong> Fixify may grant full refund, partial refund, or no refund. 
              In disputes, we will attempt mediation before determining outcome.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">7. Refund Processing Timeline</h2>
            <ul className="list-disc list-inside text-line space-y-2">
              <li><strong>Request submitted:</strong> Refund request logged in system</li>
              <li><strong>Pending phase (0-2 days):</strong> Fixify reviews request and gathers evidence</li>
              <li><strong>Processing phase (2-7 business days):</strong> Refund is processed by payment provider</li>
              <li><strong>Completed:</strong> Refund reflected in your original payment method</li>
            </ul>
            <p className="text-line mt-4">
              <strong>Note:</strong> Processing time varies by payment provider and financial institutions. 
              Razorpay typically processes refunds within 5-7 business days.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">8. Mock Payment Refunds</h2>
            <p className="text-line">
              On development environments using Mock Payments: refunds are simulated and no actual money is transferred.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">9. Refund Status Tracking</h2>
            <p className="text-line">
              Refund status progresses through the following states:
            </p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li><strong>Requested:</strong> Customer has submitted refund request</li>
              <li><strong>Pending:</strong> Fixify is reviewing the request</li>
              <li><strong>Processing:</strong> Refund has been approved and sent to payment provider</li>
              <li><strong>Completed:</strong> Refund has been successfully processed</li>
              <li><strong>Failed:</strong> Refund could not be processed (rare; customer will be contacted)</li>
            </ul>
            <p className="text-line mt-4">
              Customers can track refund status in their account dashboard.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">10. Future Policy Changes</h2>
            <p className="text-line text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <strong>[PROVISIONAL]</strong> After 3-6 months of operational experience, Fixify may establish:
            </p>
            <ul className="list-disc list-inside text-line space-y-2">
              <li>Cancellation fees or penalties for customer cancellations after a certain time</li>
              <li>Partial refunds based on work completed</li>
              <li>Professional cancellation penalties or restrictions</li>
              <li>Revised no-show policies</li>
            </ul>
            <p className="text-line mt-4">
              <strong>Notice:</strong> Any policy changes will be announced in advance. 
              Existing bookings will be grandfathered under the refund policy in effect when the booking was made.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">11. Disputes and Appeals</h2>
            <p className="text-line">
              If you disagree with a refund decision:
            </p>
            <ol className="list-decimal list-inside text-line space-y-2">
              <li>Contact Fixify support within 14 days of the decision</li>
              <li>Provide additional evidence or explanation</li>
              <li>Fixify will review your appeal</li>
              <li>We will communicate the final decision within 7 days</li>
            </ol>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">12. Contact Support</h2>
            <p className="text-line">
              To request a refund or discuss a refund-related issue:
            </p>
            <p className="text-line">
              Email:{' '}
              <a href="mailto:support@fixify.com" className="text-teal underline">
                support@fixify.com
              </a>
            </p>
            <p className="text-line mt-4">
              Include your job/booking reference, payment details, and reason for the refund request.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">13. Legal Review and Feedback</h2>
            <p className="text-line">
              This policy is provisional and will be formally reviewed by legal counsel before production deployment. 
              If you have feedback regarding this policy or believe there are errors or omissions, please contact:
            </p>
            <p className="text-line font-semibold mt-3">
              Legal Review Team<br />
              Email:{' '}
              <a href="mailto:legal@fixify.com" className="text-teal underline">
                legal@fixify.com
              </a>
            </p>
            <p className="text-line mt-3 text-sm text-line/80">
              Subject line: "Refund Policy Review — [Your Concern]"
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
