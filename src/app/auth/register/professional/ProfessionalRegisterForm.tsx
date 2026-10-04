'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { registerProfessional } from './actions';
import { signInWithGoogle } from '@/app/auth/actions';
import { PasswordField } from '@/components/ui/PasswordField';

function GoogleIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;
}

function Field({ id, label, value, error, onChange, type = 'text', autoComplete, disabled, placeholder, children }: { id: string; label: string; value: string; error?: string | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string; autoComplete: string; disabled: boolean; placeholder: string; children?: ReactNode }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">{label}</label><div className="relative"><input id={id} name={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete} disabled={disabled} placeholder={placeholder} required aria-invalid={Boolean(error)} aria-describedby={`${id}-message`} className={`min-h-[54px] w-full rounded-2xl border bg-[var(--color-paper)] px-4 ${children ? 'pr-14' : ''} text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-teal)] focus:ring-4 focus:ring-[var(--color-teal)]/10 disabled:cursor-not-allowed disabled:bg-[var(--color-porcelain)] ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-line-strong)]'}`} />{children}</div><p id={`${id}-message`} className="mt-2 min-h-5 text-xs leading-5 text-[var(--color-danger)]" aria-live="polite">{error || ' '}</p></div>;
}

export function ProfessionalRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    displayName: '',
    yearsExperience: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<'email' | 'google' | null>(null);
  const [success, setSuccess] = useState<'confirmation' | null>(null);

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setError(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (form.displayName.trim().length < 2) next.displayName = 'Enter your display name (how customers will see you).';
    if (form.yearsExperience === '' || parseInt(form.yearsExperience) < 0 || parseInt(form.yearsExperience) > 70) {
      next.yearsExperience = 'Enter years of experience (0-70).';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) next.password = 'Use 8+ characters with at least one number and one capital letter.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoadingMode('email');
    try {
      const result = await registerProfessional({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        display_name: form.displayName,
        years_experience: parseInt(form.yearsExperience),
      });

      if (!result.success) {
        setError(result.error || 'We could not create your account. Check your details and try again.');
        return;
      }

      setSuccess('confirmation');
      window.setTimeout(() => router.push('/auth/verify-email'), 900);
    } catch {
      setError('We could not create your account right now. Your details are still here—please try again.');
    } finally {
      setLoadingMode(null);
    }
  };

  const continueWithGoogle = async () => {
    setError(null);
    setLoadingMode('google');
    try {
      const result = await signInWithGoogle();
      if (result?.url) window.location.href = result.url;
      else setError('Google registration could not be started. Please try email instead.');
    } catch {
      setError('Google registration could not be started. Please try again.');
    } finally {
      setLoadingMode(null);
    }
  };

  const busy = Boolean(loadingMode);
  const passwordReady = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password);

  if (success === 'confirmation') return <div className="rounded-[28px] border border-[var(--color-teal)]/25 bg-[var(--color-paper)] p-7 shadow-[0_24px_70px_rgba(24,33,31,0.09)] sm:p-10" role="status" aria-live="polite"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-teal-soft)] text-2xl text-[var(--color-teal)]">✓</div><p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-teal)]">Professional account created</p><h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold leading-none tracking-[-0.06em]">Check your email next.</h2><p className="mt-4 text-sm leading-6 text-[var(--color-ink-3)]">We created your professional account. Confirm your email, then verify your credentials to start accepting jobs.</p><p className="mt-7 text-xs text-[var(--color-ink-4)]">Opening confirmation…</p></div>;

  return <div className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[0_24px_70px_rgba(24,33,31,0.09)] sm:p-9 lg:p-11">
    <div className="mb-8"><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-teal)]">Professional signup</p><h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold leading-none tracking-[-0.06em]">Bring your skills to Fixify.</h1><p className="mt-4 text-sm leading-6 text-[var(--color-ink-3)]">Create your professional account to start getting matched with customers. We'll verify your credentials to ensure quality and safety.</p></div>
    {error && <div className="mb-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-ink-2)]" role="alert" aria-live="polite"><strong className="block text-[var(--color-danger)]">We need another try.</strong><span className="mt-1 block">{error}</span></div>}
    <button type="button" onClick={continueWithGoogle} disabled={busy} className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-[var(--color-porcelain)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] disabled:cursor-not-allowed disabled:opacity-55">{loadingMode === 'google' ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-line-strong)] border-t-[var(--color-teal)]" aria-hidden="true" /> : <GoogleIcon />}{loadingMode === 'google' ? 'Connecting…' : 'Continue with Google'}</button>
    <div className="my-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-4)]"><span className="h-px flex-1 bg-[var(--color-line)]" />or use email<span className="h-px flex-1 bg-[var(--color-line)]" /></div>
    <form onSubmit={submit} className="space-y-1" noValidate><Field id="fullName" label="Full name" value={form.fullName} error={errors.fullName} onChange={update('fullName')} autoComplete="name" disabled={busy} placeholder="Your full legal name" /><Field id="displayName" label="Display name" value={form.displayName} error={errors.displayName} onChange={update('displayName')} autoComplete="name" disabled={busy} placeholder="How customers will see your name" /><Field id="yearsExperience" label="Years of experience" value={form.yearsExperience} error={errors.yearsExperience} onChange={update('yearsExperience')} type="number" autoComplete="off" disabled={busy} placeholder="0" /><Field id="email" label="Email address" value={form.email} error={errors.email} onChange={update('email')} type="email" autoComplete="email" disabled={busy} placeholder="you@example.com" /><div className="mb-1"><PasswordField id="password" label="Password" value={form.password} onChange={update('password')} error={errors.password} autoComplete="new-password" disabled={busy} placeholder="Create a password" /></div><p className={`-mt-1 mb-3 text-xs ${passwordReady ? 'text-[var(--color-success)]' : 'text-[var(--color-ink-4)]'}`}>Use 8+ characters, one capital letter and one number. {form.password && (passwordReady ? 'Password meets the basics.' : 'Keep going.')}</p><div className="mb-1"><PasswordField id="confirmPassword" label="Confirm password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" disabled={busy} placeholder="Repeat your password" /></div><button type="submit" disabled={busy} className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-teal)] px-5 text-base font-bold text-white shadow-[0_12px_26px_rgba(23,107,91,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--color-teal-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{loadingMode === 'email' && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}{loadingMode === 'email' ? 'Creating your account…' : 'Create professional account →'}</button></form>
    <p className="mt-6 text-xs leading-5 text-[var(--color-ink-4)]">By continuing, you agree to the <a href="#terms" className="underline hover:text-[var(--color-ink)]">Terms of Service</a> and <a href="#privacy" className="underline hover:text-[var(--color-ink)]">Privacy Policy</a>.</p><div className="mt-7 border-t border-[var(--color-line)] pt-6 text-center text-sm text-[var(--color-ink-3)]">Already have an account? <Link href="/auth/login" className="font-bold text-[var(--color-teal)] hover:underline">Sign in</Link></div>
  </div>;
}
