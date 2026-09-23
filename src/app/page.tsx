import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/site-header';
import { Hero } from '@/components/marketing/hero';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { ServiceCategoryGrid } from '@/components/marketing/service-category-grid';
import { WorkflowStory } from '@/components/marketing/workflow-story';
import { PropertyRecordPreview } from '@/components/marketing/property-record-preview';
import { CustomerCTA } from '@/components/marketing/customer-cta';
import { ProfessionalCTA } from '@/components/marketing/professional-cta';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata = {
  title: 'Fixify — Property maintenance, properly managed',
  description:
    'Describe a repair or maintenance problem, find the right service, and connect with a verified professional through Fixify.',
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <SiteHeader user={user} profile={profile} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <Hero />

        {/* Trust Strip */}
        <TrustStrip />

        {/* Service Categories */}
        <ServiceCategoryGrid />

        {/* Workflow Story */}
        <WorkflowStory />

        {/* Property Record */}
        <PropertyRecordPreview />

        {/* Customer CTA */}
        <CustomerCTA />

        {/* Professional CTA */}
        <ProfessionalCTA />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
