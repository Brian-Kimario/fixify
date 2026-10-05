import type { Metadata } from 'next';
import { SupportPageClient } from '@/components/pages/SupportPageClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixify.vercel.app';

export const metadata: Metadata = {
  title: 'Contact Support | Fixify',
  description: 'Submit a support request for help with your Fixify bookings, payments, or account',
  alternates: {
    canonical: `${siteUrl}/support`,
  },
  openGraph: {
    title: 'Contact Support | Fixify',
    description: 'Get help from Fixify support team',
    url: `${siteUrl}/support`,
    type: 'website',
    images: [
      {
        url: '/og-image-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Fixify support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Support | Fixify',
    description: 'Get help from Fixify support team',
    images: ['/og-image-1200x630.png'],
  },
};

export default function SupportPage() {
  return <SupportPageClient />;
}
