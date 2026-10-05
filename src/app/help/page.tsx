import type { Metadata } from 'next';
import { FAQPageSchema } from '@/components/seo/FAQPageSchema';
import { HelpPageClient } from '@/components/pages/HelpPageClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixify.vercel.app';

export const metadata: Metadata = {
  title: 'Help Centre | Fixify',
  description: 'Find answers about service requests, bookings, quotes, payments, and property records on Fixify',
  alternates: {
    canonical: `${siteUrl}/help`,
  },
  openGraph: {
    title: 'Help Centre | Fixify',
    description: 'Get help with Fixify property maintenance services',
    url: `${siteUrl}/help`,
    type: 'website',
    images: [
      {
        url: '/og-image-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Fixify help centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Centre | Fixify',
    description: 'Get help with Fixify property maintenance services',
    images: ['/og-image-1200x630.png'],
  },
};

const FAQ_DATA = [
  {
    id: 1,
    q: 'Do I need to know which service I need?',
    a: 'No. You can describe the problem in your own words first. Fixify can help structure the request before a service category is confirmed.',
  },
  {
    id: 2,
    q: 'What happens when inspection finds extra work?',
    a: 'The additional scope should be shown clearly before extra work is approved where approval is required. The customer should be able to review what changed and why.',
  },
  {
    id: 3,
    q: 'Where can I see the current job state?',
    a: 'Open the active booking in your customer workspace. The job timeline is intended to make the current state and the next customer action visible.',
  },
  {
    id: 4,
    q: 'Can I ask for help about a specific job?',
    a: 'Yes. Use support from the relevant job when possible so the conversation can carry the request, property and job context.',
  },
  {
    id: 5,
    q: 'How does the property record work?',
    a: 'Completed work can become part of the property\'s maintenance history, helping you understand what was serviced, repaired or replaced over time.',
  },
];

const TOPICS = [
  { num: '01', title: 'Requests', desc: 'Starting a problem report, adding media, choosing a service and understanding the intake flow.' },
  { num: '02', title: 'Bookings & status', desc: 'Professional assignment, arrival, inspection, quote approval and completed work.' },
  { num: '03', title: 'Quotes & payments', desc: 'Inspection changes, customer approval, invoices and payment questions.' },
  { num: '04', title: 'Property record', desc: 'How completed work, parts, documents and maintenance history stay connected to a property.' },
  { num: '05', title: 'Account & access', desc: 'Sign-in, account details and accessing the right Fixify workspace.' },
  { num: '06', title: 'Safety & complaints', desc: 'When to stop work, how to raise a concern and what information helps Fixify respond.' },
];

export default function HelpPage() {
  return (
    <>
      <FAQPageSchema />
      <HelpPageClient FAQ_DATA={FAQ_DATA} TOPICS={TOPICS} />
    </>
  );
}
