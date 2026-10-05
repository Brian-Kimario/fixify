import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fixify.vercel.app";

export const metadata: Metadata = {
  title: "Create Account | Fixify",
  description: "Sign up as a customer to start requesting property maintenance services on Fixify.",
  openGraph: {
    title: "Create Account | Fixify",
    description: "Sign up for Fixify",
    url: `${siteUrl}/auth/register`,
    type: "website",
    images: [{ url: "/og-image-1200x630.png", width: 1200, height: 630, alt: "Create Account" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Account | Fixify",
    description: "Sign up for Fixify",
    images: ["/og-image-1200x630.png"],
  },
  alternates: {
    canonical: `${siteUrl}/auth/register`,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
