'use client';

import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithEmail, signInWithGoogle } from '@/app/auth/actions';
import { Lockup } from '@/components/brand/Lockup';

function GoogleIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.3A10.8 10.8 0 0112 4c5.2 0 9.2 4 10.5 8a11.8 11.8 0 01-3.1 5.1M6.2 6.2A12 12 0 0012 20c1 0 2-.2 2.9-.4" /></svg> : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S5.2 4 12 4s10.5 8 10.5 8S18.8 20 12 20 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="2.7" /></svg>;
}

function LoginFormContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const requestedRole = searchParams.get('role');
  const isProfessional = requestedRole === 'professional';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isLoggedOut = searchParams.get('logged_out') === '1' || searchParams.get('logged_out') === 'true';
  const callbackError = searchParams.get('error');
  const callbackMessage = callbackError ? 'Google sign-in could not be completed. Try again or continue with email.' : null;

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    if (!email.trim()) setEmailError('Enter the email address attached to your Fixify account.');
    if (!password) setPasswordError('Enter your password to continue.');
    if (!email.trim() || !password) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmail(email, password, next);
      if (result?.success && result?.redirectPath) {
        window.location.href = result.redirectPath;
        return;
      }
      setError('Sign-in succeeded but the next step could not be opened. Please refresh and try again.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Invalid login credentials')) setError('Email or password is incorrect. Please try again.');
      else if (message.includes('Email not confirmed')) setError('Confirm your email before signing in.');
      else if (!message.includes('NEXT_REDIRECT')) setError('We could not sign you in right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(next);
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      setError('Google sign-in could not be started. Please try email instead.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('NEXT_REDIRECT') && !message.includes('redirect')) setError('Google sign-in could not be started. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-porcelain)] px-5 py-8 text-[var(--color-ink)] sm:px-8 sm:py-12">
      <div className="w-full max-w-[480px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <header className="mb-8 text-center"><Lockup size="md" href="/" className="mx-auto w-fit" /><p className="mt-4 text-sm font-medium text-[var(--color-ink-3)]">Property maintenance, made clearer.</p></header>
        <section className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[0_24px_70px_rgba(24,33,31,0.09)] sm:p-9" aria-label="Sign in to Fixify">
          <div className="mb-8"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-teal)]">{isProfessional ? 'Professional access' : 'Customer access'}</p><h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold leading-none tracking-[-0.06em]">Welcome back.</h1><p className="mt-4 text-sm leading-6 text-[var(--color-ink-3)]">{isProfessional ? 'Sign in to continue your Fixify professional onboarding or field workspace.' : 'Continue managing your Fixify services.'}</p></div>
          {isLoggedOut && !error && <div className="mb-6 rounded-2xl border border-[var(--color-teal)]/25 bg-[var(--color-teal-soft)] p-4 text-sm text-[var(--color-ink-2)]" role="status"><strong className="block text-[var(--color-teal)]">You are signed out.</strong><span className="mt-1 block">Your session was closed securely. Sign in again when you are ready.</span></div>}
          {(error || callbackMessage) && <div className="mb-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-ink-2)]" role="alert" aria-live="polite"><strong className="block text-[var(--color-danger)]">Sign-in needs another try.</strong><span className="mt-1 block">{error || callbackMessage}</span></div>}
          <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-porcelain)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] disabled:cursor-not-allowed disabled:opacity-55">{isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-line-strong)] border-t-[var(--color-teal)]" aria-hidden="true" /> : <GoogleIcon />}{isLoading ? 'Connecting…' : 'Continue with Google'}</button>
          <div className="my-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-4)]"><span className="h-px flex-1 bg-[var(--color-line)]" />or continue with email<span className="h-px flex-1 bg-[var(--color-line)]" /></div>
          <form onSubmit={handleEmailSignIn} className="space-y-5" noValidate>
            <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label><input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(null); }} disabled={isLoading} required aria-invalid={Boolean(emailError)} aria-describedby="email-help" className={`min-h-[54px] w-full rounded-2xl border bg-[var(--color-paper)] px-4 text-base outline-none transition focus:border-[var(--color-teal)] focus:ring-4 focus:ring-[var(--color-teal)]/10 disabled:cursor-not-allowed disabled:bg-[var(--color-porcelain)] ${emailError ? 'border-[var(--color-danger)]' : 'border-[var(--color-line-strong)]'}`} /><p id="email-help" className="mt-2 min-h-5 text-xs text-[var(--color-danger)]" aria-live="polite">{emailError || ' '}</p></div>
            <div><div className="mb-2 flex items-center justify-between gap-4"><label htmlFor="password" className="block text-sm font-semibold">Password</label><Link href="/auth/forgot-password" className="text-xs font-semibold text-[var(--color-teal)] hover:underline">Forgot password?</Link></div><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(null); }} disabled={isLoading} required aria-invalid={Boolean(passwordError)} aria-describedby="password-help" className={`min-h-[54px] w-full rounded-2xl border bg-[var(--color-paper)] px-4 pr-14 text-base outline-none transition focus:border-[var(--color-teal)] focus:ring-4 focus:ring-[var(--color-teal)]/10 disabled:cursor-not-allowed disabled:bg-[var(--color-porcelain)] ${passwordError ? 'border-[var(--color-danger)]' : 'border-[var(--color-line-strong)]'}`} /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-[var(--color-ink-3)] transition hover:bg-[var(--color-porcelain)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]"><EyeIcon hidden={showPassword} /></button></div><p id="password-help" className="mt-2 min-h-5 text-xs text-[var(--color-danger)]" aria-live="polite">{passwordError || ' '}</p></div>
            <button type="submit" disabled={isLoading} className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-teal)] px-5 text-base font-bold text-white transition hover:bg-[var(--color-teal-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isLoading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}{isLoading ? 'Signing you in…' : 'Sign in'}</button>
          </form>
          <div className="mt-7 border-t border-[var(--color-line)] pt-6 text-center text-sm text-[var(--color-ink-3)]">New to Fixify? <Link href="/auth/register" className="font-bold text-[var(--color-teal)] hover:underline">Create an account</Link></div>
        </section>
        <p className="mt-6 text-center text-xs text-[var(--color-ink-4)]"><Link href="/" className="hover:text-[var(--color-teal)]">Back to homepage</Link></p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin">Loading...</div></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
