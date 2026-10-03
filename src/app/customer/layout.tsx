import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutMenu } from "@/components/shared/SignOutMenu";
import { Symbol } from "@/components/brand/Symbol";

export const metadata = {
  title: "Dashboard — Fixify",
  description: "Request jobs, track professionals, manage your properties",
};

interface CustomerLayoutProps {
  children: React.ReactNode;
}

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
            <span>Fixify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <a href="/customer" className="text-sm font-semibold text-[#5A6661] hover:text-[#0D5144] transition">Dashboard</a>
            <a href="/customer/properties" className="text-sm font-semibold text-[#5A6661] hover:text-[#0D5144] transition">Properties</a>
            <a href="/customer/support" className="text-sm font-semibold text-[#5A6661] hover:text-[#0D5144] transition">Support</a>
          </nav>

          {/* Profile Section (Desktop only) */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
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
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFEFA] border-t border-[#D9DED8] flex items-center justify-around h-20">
        <a href="/customer" className="flex flex-col items-center justify-center gap-1 text-[#5A6661] hover:text-[#0D5144] transition py-2 px-3 flex-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
            <rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>
          </svg>
          <span className="text-xs font-semibold">Dashboard</span>
        </a>
        <a href="/customer/properties" className="flex flex-col items-center justify-center gap-1 text-[#5A6661] hover:text-[#0D5144] transition py-2 px-3 flex-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
            <path d="m4 10 8-6 8 6v9H4zM9 19v-5h6v5"/>
          </svg>
          <span className="text-xs font-semibold">Properties</span>
        </a>
        <a href="/customer/support" className="flex flex-col items-center justify-center gap-1 text-[#5A6661] hover:text-[#0D5144] transition py-2 px-3 flex-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
            <path d="M5 6h14v10H9l-4 4z"/>
          </svg>
          <span className="text-xs font-semibold">Support</span>
        </a>
        <a href="/customer/profile" className="flex flex-col items-center justify-center gap-1 text-[#5A6661] hover:text-[#0D5144] transition py-2 px-3 flex-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
            <circle cx="12" cy="8" r="3"/><path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5"/>
          </svg>
          <span className="text-xs font-semibold">Account</span>
        </a>
      </nav>
    </div>
  );
}
