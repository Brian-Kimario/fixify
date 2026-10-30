import type { Metadata } from 'next';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Hero } from '@/components/home/hero';
import { FactsStrip, HowItWorks, ServicesIndex, PropertyRecord, ProfessionalSection, Faq, ClosingCta } from '@/components/home/sections';
import type { ViewerRole } from '@/lib/marketing-links';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Feasy — Book Verified Home Repair Professionals",
  description: "Book verified plumbers, electricians and handymen for your home. Describe the problem, compare quotes, pay by UPI, and track the job to completion.",
  openGraph: {
    title: "Feasy — Book Verified Home Repair Professionals",
    description: "Book verified plumbers, electricians and handymen. Compare quotes and pay by UPI.",
    url: siteUrl,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Feasy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feasy — Book Verified Home Repair Professionals",
    description: "Book verified home repair professionals. Compare quotes and pay by UPI.",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function HomePage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const role = (user ? (profile?.role ?? 'customer') : null) as ViewerRole;
  return (
    <div className="flex min-h-screen flex-col bg-porcelain font-sans text-ink">
      <SiteHeader role={role} />
      <main id="main-content" className="flex-1">
        <Hero role={role} />
        <FactsStrip />
        <HowItWorks />
        <ServicesIndex role={role} />
        <PropertyRecord role={role} />
        <ProfessionalSection role={role} />
        <Faq />
        <ClosingCta role={role} />
      </main>
      <SiteFooter />
    </div>
  );
}
