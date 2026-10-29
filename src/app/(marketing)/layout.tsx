import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <div className="min-h-screen bg-porcelain flex flex-col">
      <SiteHeader role={user ? profile?.role ?? 'customer' : null} />
      <main id="main-content" className="flex-1 pt-[76px]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
