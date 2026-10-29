import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Contact Support | Feasy",
  description: "Submit a support request for help with your Feasy bookings, payments, or account.",
  openGraph: {
    title: "Contact Support | Feasy",
    description: "Get help from Feasy support team",
    url: `${siteUrl}/support`,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Feasy Support" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Support | Feasy",
    description: "Get help from Feasy support team",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: `${siteUrl}/support`,
  },
};

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?role=support');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'support') redirect('/');

  return (
    <div className="min-h-screen bg-porcelain text-ink">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-teal">Feasy support</p>
            <p className="mt-1 text-sm font-semibold">{profile.full_name || user.email}</p>
          </div>
          <Link href="/auth/logout?role=support" className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-3 transition hover:border-ink-3 hover:text-ink">
            Sign out
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
