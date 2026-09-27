import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CustomerNavbar } from "./CustomerNavbar";
import { PrototypeNotice } from "@/components/ui/PrototypeNotice";

export const metadata = {
  title: "Residence Dashboard - Fixify",
  description: "Request certified maintenance, track real-time dispatch, and inspect permanent property records",
};

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?role=customer");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "customer") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-porcelain flex flex-col justify-between">
      <div>
        <CustomerNavbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PrototypeNotice audience="Customer workspace" />
          {children}
        </main>
      </div>

      {/* Fixify Theme Footer */}
      <footer className="border-t border-line bg-paper py-8 mt-16 text-xs text-ink-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-line">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-base text-ink tracking-tight">Fixify</span>
              <span className="text-ink-4">|</span>
              <span className="text-ink-3">Resident & Property Owner Network</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 font-medium">
              <Link href="/customer" className="hover:text-teal transition-colors">
                Dashboard
              </Link>
              <Link href="/customer/properties" className="hover:text-teal transition-colors">
                Properties
              </Link>
              <Link href="/customer?tab=records" className="hover:text-teal transition-colors">
                Passport Records
              </Link>
              <Link href="/customer?tab=intake" className="hover:text-teal transition-colors">
                Book Service
              </Link>
              <Link href="/auth/logout" className="text-danger hover:underline transition-colors font-semibold">
                Sign out
              </Link>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-ink-4 text-[11px]">
            <p>© 2026 Fixify Inc. All rights reserved. A 30-day workmanship warranty applies where the recorded service policy permits.</p>
            <p className="font-mono text-ink-4">PAYMENT STATUS IS SERVER-CONFIRMED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
