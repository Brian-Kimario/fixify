import type { Metadata } from 'next';
import { RegisterPageClient } from '@/components/pages/RegisterPageClient';

export const metadata: Metadata = {
  title: 'Create Account | Feasy',
  description: 'Sign up as a customer to start requesting property maintenance services on Feasy',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return <RegisterPageClient />;
}
