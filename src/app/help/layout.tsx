import type { Metadata } from 'next';
import { FAQPageSchema } from '@/components/seo/FAQPageSchema';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Help Centre | Feasy",
  description: "Find answers about service requests, bookings, quotes, payments, and property records on Feasy.",
  openGraph: {
    title: "Help Centre | Feasy",
    description: "Get help with Feasy property maintenance services",
    url: `${siteUrl}/help`,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Feasy Help" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Centre | Feasy",
    description: "Find answers about Feasy services",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: `${siteUrl}/help`,
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FAQPageSchema />
      {children}
    </>
  );
}
