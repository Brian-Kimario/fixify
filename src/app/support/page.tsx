import type { Metadata } from 'next';
import { SupportPageClient } from '@/components/pages/SupportPageClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixify.vercel.app';

export const metadata: Metadata = {
  title: 'Contact Support | Feasy',
  description: 'Submit a support request for help with your Feasy bookings, payments, or account',
  alternates: {
    canonical: `${siteUrl}/support`,
  },
  openGraph: {
    title: 'Contact Support | Feasy',
    description: 'Get help from Feasy support team',
    url: `${siteUrl}/support`,
    type: 'website',
    images: [
      {
        url: '/og-image-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Feasy support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Support | Feasy',
    description: 'Get help from Feasy support team',
    images: ['/og-image-1200x630.png'],
  },
};

export default function SupportPage() {
  return <SupportPageClient />;
}
