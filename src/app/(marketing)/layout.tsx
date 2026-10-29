import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-porcelain flex flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 pt-[76px]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
