import { LoginForm } from './LoginForm';
import { Lockup } from '@/components/brand';
import Link from 'next/link';

export const metadata = {
  title: 'Login - Fixify',
  description: 'Sign in to your Fixify account',
};

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="text-line text-base">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border border-line"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark text-line">or</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <button
          className={`
            w-full py-2.5 px-4 rounded-lg
            border border-line
            bg-panel text-ink
            font-medium
            hover:bg-line active:bg-line
            focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-dark
            transition-all duration-200
          `}
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </span>
        </button>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-line text-sm">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="text-mint font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-mint rounded"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center pt-4 border-t border-line">
          <Link
            href="/help"
            className="text-line text-sm hover:text-mint transition-colors"
          >
            Need help? Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
