'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Hammer, Home } from 'lucide-react';
import {
  signInWithEmail,
  signInWithGoogle,
  type SignInAudience,
  type SignInFailure,
} from '@/app/auth/actions';
import { Symbol } from '@/components/brand/Symbol';
import { PasswordField } from '@/components/ui/PasswordField';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const COPY: Record<
  SignInAudience,
  {
    label: string;
    heading: string;
    sub: string;
    panelKicker: string;
    panelHeading: string;
    points: readonly string[];
    registerHref: string;
    registerText: string;
    registerCta: string;
  }
> = {
  customer: {
    label: 'I need a repair',
    heading: 'Welcome back.',
    sub: 'Pick up your requests, quotes and property record.',
    panelKicker: 'For customers',
    panelHeading: 'Your home, looked after and written down.',
    points: ['Track every job from request to payment', 'Approve itemised quotes before work starts', 'Keep invoices and warranties on file'],
    registerHref: '/auth/register',
    registerText: 'New to Feasy?',
    registerCta: 'Create a customer account',
  },
  professional: {
    label: 'I’m a professional',
    heading: 'Professional sign in.',
    sub: 'Open your job requests, quotes and earnings.',
    panelKicker: 'For professionals',
    panelHeading: 'Your jobs, quotes and earnings in one place.',
    points: ['See new requests near you', 'Send itemised quotes from your phone', 'Get paid by UPI when the job is done'],
    registerHref: '/auth/register/professional',
    registerText: 'Not on Feasy yet?',
    registerCta: 'Apply as a professional',
  },
};

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const requested = searchParams.get('as') ?? searchParams.get('role');
  const [audience, setAudience] = useState<SignInAudience>(requested === 'professional' ? 'professional' : 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failure, setFailure] = useState<SignInFailure | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isLoggedOut = ['1', 'true'].includes(searchParams.get('logged_out') ?? '');
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const copy = COPY[audience];
  const isPro = audience === 'professional';
  // Only carry `next` across the audience switch when it still makes sense there.
  const nextForAudience = next && next.startsWith(`/${audience}`) ? next : null;

  const switchAudience = (to: SignInAudience) => {
    if (to === audience || isLoading) return;
    setAudience(to);
    setFailure(null);
    setGoogleError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('role');
    params.set('as', to);
    if (next && !next.startsWith(`/${to}`)) params.delete('next');
    window.history.replaceState(null, '', `/auth/login?${params.toString()}`);
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setEmailError(null);
    setPasswordError(null);
    if (!email.trim()) setEmailError('Enter the email address on your account.');
    if (!password) setPasswordError('Enter your password to continue.');
    if (!email.trim() || !password) return;
    setIsLoading(true);
    try {
      // On success the server action redirects (NEXT_REDIRECT) and never returns.
      const result = await signInWithEmail(email, password, nextForAudience, audience);
      setFailure(result);
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('NEXT_REDIRECT')) return;
      setFailure({ ok: false, code: 'unknown', message: 'We could not sign you in right now. Please try again.' });
      setIsLoading(false);
    }
    // Keep the spinner on success while Next navigates.
  };

  const handleGoogleSignIn = async () => {
    setFailure(null);
    setGoogleError(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(nextForAudience);
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      setGoogleError('Google sign-in could not be started. Please use email instead.');
    } catch {
      setGoogleError('Google sign-in could not be started. Please try again.');
    }
    setIsLoading(false);
  };

  const inputCls =
    'mt-2 block min-h-12 w-full rounded-base border bg-paper px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:opacity-60';

  return (
    <main id="main-content" className="grid min-h-dvh w-full bg-porcelain font-sans text-ink lg:grid-cols-[1fr_minmax(520px,1fr)]">
      {/* Audience panel: desktop only. Different surface per audience so you always know which door you're at. */}
      <aside
        aria-hidden={false}
        className={`relative hidden flex-col justify-between overflow-hidden p-10 lg:flex ${
          isPro ? 'bg-ink text-porcelain' : 'bg-teal-wash text-ink'
        }`}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 [background-size:34px_34px] ${
            isPro
              ? '[background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]'
              : '[background-image:linear-gradient(rgba(23,107,91,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(23,107,91,0.08)_1px,transparent_1px)]'
          } [mask-image:linear-gradient(to_bottom,black,transparent_85%)]`}
        />
        <Link href="/" className="relative inline-flex w-fit items-center gap-2.5 font-editorial text-[26px] tracking-[-0.02em]">
          <Symbol size="md" className={`size-[30px] ${isPro ? 'text-[#7FC4B1]' : 'text-teal'}`} />
          Feasy
        </Link>

        <div className="relative max-w-[30rem]">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.16em] ${isPro ? 'text-[#7FC4B1]' : 'text-teal'}`}>
            {copy.panelKicker}
          </p>
          <h2 className="mt-4 font-editorial text-[clamp(38px,4vw,56px)] font-normal leading-[1.04] tracking-[-0.02em]">
            {copy.panelHeading}
          </h2>
          <ul className="mt-8 space-y-3.5">
            {copy.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[15.5px]">
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${isPro ? 'bg-[#7FC4B1] text-ink' : 'bg-teal text-paper'}`}>
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                </span>
                <span className={isPro ? 'text-porcelain/80' : 'text-ink-2'}>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={`relative text-[13px] ${isPro ? 'text-porcelain/55' : 'text-ink-3'}`}>
          {isPro ? 'Professionals are verified before they can accept jobs.' : 'Quoted in rupees. Paid by UPI. Kept on record.'}
        </p>
      </aside>

      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[14px] text-ink-3 transition-colors hover:text-ink">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 font-editorial text-[22px] tracking-[-0.02em] lg:hidden">
            <Symbol size="md" className="size-[26px] text-teal" />
            Feasy
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {/* Audience switch */}
          <div role="group" aria-label="Sign in as" className="grid grid-cols-2 gap-1 rounded-2xl border border-line-strong bg-paper-2 p-1">
            {(['customer', 'professional'] as const).map((a) => {
              const active = a === audience;
              const Icon = a === 'customer' ? Home : Hammer;
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={active}
                  onClick={() => switchAudience(a)}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 text-[13.5px] font-semibold transition-colors ${
                    active ? (a === 'professional' ? 'bg-ink text-porcelain shadow-sm' : 'bg-teal text-paper shadow-sm') : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  {COPY[a].label}
                </button>
              );
            })}
          </div>

          <h1 className="mt-9 font-editorial text-[clamp(34px,5vw,44px)] font-normal leading-[1.05] tracking-[-0.02em]">{copy.heading}</h1>
          <p className="mt-2 text-[15px] text-ink-3">{copy.sub}</p>

          {isLoggedOut && !failure && (
            <p role="status" className="mt-6 rounded-xl bg-teal-wash px-4 py-3 text-[14px] text-teal-deep">You’re signed out. Sign in to continue.</p>
          )}
          {sessionExpired && !failure && (
            <p role="status" className="mt-6 rounded-xl bg-ochre-soft px-4 py-3 text-[14px] text-ochre">Your session expired. Please sign in again.</p>
          )}
          {failure && (
            <div role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-[14px] text-clay">
              <p>{failure.message}</p>
              {failure.code === 'wrong_audience' && failure.actualAudience && (
                <button
                  type="button"
                  onClick={() => switchAudience(failure.actualAudience as SignInAudience)}
                  className="mt-2 cursor-pointer font-semibold underline underline-offset-4"
                >
                  Switch to {failure.actualAudience === 'professional' ? 'professional' : 'customer'} sign-in
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} noValidate className="mt-6">
            {!isPro && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-line-strong bg-paper text-[15px] font-medium transition-colors hover:border-ink-3 disabled:opacity-60"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
                {googleError && <p role="alert" className="mt-2 text-[13px] text-clay">{googleError}</p>}
                <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-ink-4">
                  <span className="h-px flex-1 bg-line-strong" /> or <span className="h-px flex-1 bg-line-strong" />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="text-[13.5px] font-semibold">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                disabled={isLoading}
                aria-invalid={Boolean(emailError)}
                className={`${inputCls} ${emailError ? 'border-clay' : 'border-line-strong'}`}
              />
              {emailError && <p role="alert" className="mt-1.5 text-[13px] text-clay">{emailError}</p>}
            </div>

            <div className="mt-4">
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                error={passwordError ?? undefined}
                disabled={isLoading}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Link href="/auth/forgot-password" className="text-[13.5px] font-medium text-teal underline decoration-teal/30 underline-offset-4 hover:decoration-teal">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-porcelain transition-colors disabled:opacity-70 ${
                isPro ? 'bg-ink hover:bg-ink-2' : 'bg-teal hover:bg-teal-deep'
              }`}
            >
              {isLoading ? 'Signing you in…' : isPro ? 'Sign in to your workspace' : 'Sign in'}
              {!isLoading && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-7 text-center text-[14px] text-ink-3">
            {copy.registerText}{' '}
            <Link href={copy.registerHref} className="font-semibold text-teal underline decoration-teal/30 underline-offset-4 hover:decoration-teal">
              {copy.registerCta}
            </Link>
          </p>
          <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-4">
            By continuing you agree to Feasy’s <Link href="/terms" className="underline underline-offset-2">terms</Link> and{' '}
            <Link href="/privacy" className="underline underline-offset-2">privacy notice</Link>.
            {isPro && ' Professionals must be verified before accepting jobs.'}
          </p>
        </div>
      </section>
    </main>
  );
}
