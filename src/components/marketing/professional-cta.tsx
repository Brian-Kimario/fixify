import Link from 'next/link';
import { Button } from '@/components/ui';

export function ProfessionalCTA() {
  return (
    <section className="py-16 sm:py-24 bg-panel">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-ink">
              For professionals who take their work seriously
            </h2>
            <p className="text-line text-lg">
              Build a reliable service pipeline, manage jobs clearly, and grow your work with Fixify.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: '💼',
                title: 'Professional workspace',
                description: 'Manage bids, jobs, and earnings in one place',
              },
              {
                icon: '🎯',
                title: 'Qualified leads',
                description: 'Job requests already problem-qualified and customer-vetted',
              },
              {
                icon: '💳',
                title: 'Reliable payments',
                description: 'Secure, timely payouts for completed work',
              },
              {
                icon: '⭐',
                title: 'Build reputation',
                description: 'Customer reviews and service history to attract more work',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-dark/50 space-y-2">
                <div className="text-3xl">{benefit.icon}</div>
                <h3 className="font-display font-bold text-ink">{benefit.title}</h3>
                <p className="text-line text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/pro/onboarding" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                Become a Fixify professional
              </Button>
            </Link>
            <Link href="/pro/login" className="flex-1">
              <Button variant="secondary" size="lg" className="w-full">
                Already registered? Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
