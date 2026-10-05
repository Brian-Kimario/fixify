import type { Metadata } from 'next';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/site-header';
import { RepairSceneHero } from '@/components/marketing/repair-scene-hero';
import { ServiceCategoryGrid } from '@/components/marketing/service-category-grid';
import { WorkflowStory } from '@/components/marketing/workflow-story';
import { PropertyRecordPreview } from '@/components/marketing/property-record-preview';
import { SiteFooter } from '@/components/marketing/site-footer';
import { REPAIR_CATEGORIES } from '@/lib/repair-categories';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Fixify — Property Maintenance, Made Simple",
  description: "Connect with verified professionals for plumbing, electrical, handyman and other property maintenance services. Describe your problem and let Fixify handle the rest.",
  openGraph: {
    title: "Fixify — Property Maintenance, Made Simple",
    description: "Connect with verified professionals for plumbing, electrical, handyman and other property maintenance services",
    url: siteUrl,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Fixify" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fixify — Property Maintenance, Made Simple",
    description: "Connect with verified professionals for property maintenance services",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function HomePage() {
  const user = await getCurrentUser(); const profile = await getCurrentProfile();
  return <div className="min-h-screen bg-[#F7F4EC] flex flex-col"><SiteHeader user={user} profile={profile} /><main id="main-content" className="flex-1"><RepairSceneHero categories={REPAIR_CATEGORIES} /><ServiceCategoryGrid /><WorkflowStory /><PropertyRecordPreview /><ProfessionalBand /><FinalCTA /></main><SiteFooter /></div>;
}
function ProfessionalBand() { return <section id="professionals" className="py-20 sm:py-28 bg-[#F1EEE5] border-t border-[#D9DED8]"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 lg:gap-20 items-center"><div className="space-y-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#5A6661]">For professionals</p><h2 className="text-5xl lg:text-6xl font-bold text-[#18211F] leading-tight tracking-tight max-w-[11ch]">You fix it. Fixify handles the coordination.</h2><p className="text-base text-[#34413D] max-w-[52ch] mt-4">Requests, availability, customer context, quote steps, completion evidence and earnings live in a separate professional workspace.</p></div><div className="flex flex-col gap-3"><a href="/professional" className="inline-flex items-center justify-center px-6 py-3 bg-[#176B5B] text-white rounded-[11px] font-semibold text-sm hover:bg-[#0D5144] transition-colors">See the professional space</a><a href="/auth/login" className="inline-flex items-center justify-center px-6 py-3 border border-[#B8C3BC] bg-white text-[#18211F] rounded-[11px] font-semibold text-sm hover:bg-[#F7F4EC] transition-colors">Professional sign in</a></div></div></div></section>; }
function FinalCTA() { return <section className="py-24 sm:py-32 bg-[#F7F4EC] text-center"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><p className="text-xs font-semibold uppercase tracking-wider text-[#5A6661] mb-6">Start with the problem</p><h2 className="text-6xl lg:text-7xl font-bold text-[#18211F] leading-tight tracking-tight max-w-[11ch] mx-auto">Something needs fixing?</h2><p className="text-base text-[#34413D] max-w-[52ch] mx-auto mt-6">You do not need to know the service name. Just explain what is happening.</p><a href="/customer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#176B5B] text-white rounded-[11px] font-semibold text-sm hover:bg-[#0D5144] transition-colors mt-8">Describe a problem <span>↗</span></a></div></section>; }
