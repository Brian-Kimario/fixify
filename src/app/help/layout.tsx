import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Help Centre | Fixify",
  description: "Find answers about service requests, bookings, quotes, payments, and property records on Fixify.",
  openGraph: {
    title: "Help Centre | Fixify",
    description: "Get help with Fixify property maintenance services",
    url: `${siteUrl}/help`,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Fixify Help" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Centre | Fixify",
    description: "Find answers about Fixify services",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: `${siteUrl}/help`,
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
