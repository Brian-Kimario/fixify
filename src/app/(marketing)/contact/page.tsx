import type { Metadata } from 'next';
import { ContactPageClient } from '@/components/pages/ContactPageClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixify.vercel.app';

export const metadata: Metadata = {
  title: 'Contact Fixify | Get Help with Property Maintenance',
  description: 'Have questions about Fixify? Contact our support team for information about services, partnerships, or feedback',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'Contact Fixify',
    description: 'Contact Fixify support',
    url: `${siteUrl}/contact`,
    type: 'website',
    images: [
      {
        url: '/og-image-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Fixify contact',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Fixify',
    description: 'Contact Fixify support',
    images: ['/og-image-1200x630.png'],
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
