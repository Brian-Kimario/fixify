import { RegisterForm } from './RegisterForm';
import { Lockup } from '@/components/brand';
import Link from 'next/link';

export const metadata = {
  title: 'Sign Up - Fixify',
  description: 'Create your Fixify account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Lockup size="lg" layout="horizontal" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-ink mb-2">
            Join Fixify
          </h1>
          <p className="text-line text-base">
            Create an account to get started
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm />

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-line text-sm">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-mint font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-mint rounded"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="text-center pt-4 border-t border-line">
          <p className="text-line text-xs">
            By signing up, you agree to our{' '}
            <a
              href="/terms"
              className="text-mint hover:underline"
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a
              href="/privacy"
              className="text-mint hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
