import Link from 'next/link';
import { Button } from '@/components/ui';

export function CustomerCTA() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-r from-mint/10 to-mint/5 border-y border-mint/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-ink">
            Something at home needs attention?
          </h2>
          <p className="text-line text-lg">
            Start with the problem. We'll take it from there.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/customer">
            <Button variant="primary" size="lg">
              Describe a problem →
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="secondary" size="lg">
              Browse services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
