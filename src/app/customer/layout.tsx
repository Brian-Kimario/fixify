import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutMenu } from "@/components/shared/SignOutMenu";
import { Symbol } from "@/components/brand/Symbol";
import { TopNavLinks, BottomNavLinks } from '@/components/shared/AppNavLinks';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Dashboard — Feasy",
  description: "Request jobs, track professionals, manage your properties",
};

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/customer', label: 'Dashboard', exact: true, icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg> },
  { href: '/customer/bookings', label: 'Bookings', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg> },
  { href: '/customer/properties', label: 'Properties', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><path d="m4 10 8-6 8 6v9H4zM9 19v-5h6v5"/></svg> },
  { href: '/customer/support', label: 'Support', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><path d="M5 6h14v10H9l-4 4z"/></svg> },
] as const;

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "customer") redirect("/");

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Customer";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FFFEFA] border-b border-[#D9DED8]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 h-16">
          {/* Logo */}
          <Link href="/customer" className="inline-flex items-center gap-2 md:gap-2.5 font-bold text-sm md:text-[18px] tracking-[-0.035em] text-[#18211F] flex-shrink-0">
            <span className="w-[24px] h-[24px] md:w-[29px] md:h-[29px] flex items-center justify-center">
              <Symbol size="sm" className="w-full h-full" />
            </span>
            <span>Feasy</span>
          </Link>

          {/* Desktop Navigation */}
          <TopNavLinks items={NAV_ITEMS} />

          {/* Account menu (all breakpoints) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <SignOutMenu 
              user={user} 
              displayName={displayName}
              initials={initials}
              role="customer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavLinks items={NAV_ITEMS} />
    </div>
  );
}
