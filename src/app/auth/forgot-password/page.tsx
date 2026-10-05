'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Symbol } from '@/components/brand/Symbol';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter the email address attached to your Fixify account.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send the reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="page">
      <section className="visual" aria-label="Fixify home maintenance introduction">
        <Image 
          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1800&q=88" 
          alt="Calm bedroom interior"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="object-cover"
          style={{ filter: 'saturate(0.88) contrast(1.06) brightness(0.78)' }}
        />
        <div className="visual-grid" aria-hidden="true" />
        <div className="visual-top"><Link className="back" href="/">Back to home</Link></div>
        <div className="visual-bottom">
          <p className="visual-eyebrow">A home worth looking after</p>
          <h1>Keep every repair moving in the <strong>right direction.</strong></h1>
          <p>Find your way back to a home that feels in control.</p>
        </div>
      </section>

      <section className="form-side">
        <div className="form-wrap">
          <Link className="brand auth-brand" href="/"><Symbol size="lg" className="brand-mark" /><span>FIXIFY</span></Link>
          {sent ? (
            <div className="success-state">
              <div className="success-icon" aria-hidden="true"><CheckCircle2 /></div>
              <p className="form-eyebrow">EMAIL ON ITS WAY</p>
              <h2>Check your inbox.</h2>
              <p className="sub">We sent a secure password reset link to <strong>{email}</strong>.</p>
              <p className="helper">The link may take a minute to arrive. If you do not see it, check your spam or promotions folder.</p>
              <Link className="back-link" href="/auth/login"><ArrowLeft size={16} /> Back to sign in</Link>
            </div>
          ) : (
            <>
              <Link className="back-link top-back" href="/auth/login"><ArrowLeft size={15} /> Back to sign in</Link>
              <p className="form-eyebrow">ACCOUNT ACCESS</p>
              <h2>Reset your password.</h2>
              <p className="sub">Enter your email and we&apos;ll send you a secure link to get back into your Fixify account.</p>
              <form className="form" onSubmit={handleSubmit} noValidate>
                {error && <div className="status-msg error-msg" role="alert">{error}</div>}
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrap">
                    <Mail className="mail-icon" size={18} aria-hidden="true" />
                    <input className="input" id="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(null); }} disabled={isLoading} required />
                  </div>
                </div>
                <button type="submit" className="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="spinner" size={17} /> Sending reset link…</> : 'Send reset link ↗'}
                </button>
              </form>
              <p className="signup">Remember your password? <Link href="/auth/login">Sign in</Link></p>
              <p className="fineprint">For your security, Fixify never asks you to share your password by email or message.</p>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        main { min-height: 100dvh; width: 100%; display: grid; grid-template-columns: minmax(0,.92fr) minmax(420px,1.08fr); }
        .visual { position: relative; min-height: 100vh; padding: 28px; overflow: hidden; background: var(--color-ink); }
        .visual img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.88) contrast(1.06) brightness(.78); }
        .visual::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg,rgba(8,23,20,.22),rgba(8,23,20,.82)),linear-gradient(90deg,rgba(8,23,20,.30),rgba(8,23,20,.08) 70%); z-index: 1; }
        .visual-grid { position: absolute; inset: 0; z-index: 2; background-image: linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px); background-size: 34px 34px; opacity: .45; mask-image: linear-gradient(to bottom,black,transparent 90%); }
        .visual-top { position: relative; z-index: 3; display: flex; justify-content: flex-end; color: white; }
        .back { font-size: 12px; color: rgba(255,255,255,.72); padding-top: 5px; text-decoration: none; }
        .back:hover { color: white; }
        .visual-bottom { position: absolute; left: 28px; right: 28px; bottom: 30px; z-index: 3; padding: 24px; background: linear-gradient(180deg,rgba(8,23,20,.76),rgba(8,23,20,.96)); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; backdrop-filter: blur(8px); }
        .visual-eyebrow { margin: 0 0 13px; color: #8dd1c0; font: 600 10px var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
        .visual-bottom h1 { margin: 0; font-size: clamp(42px,5vw,68px); line-height: 1.02; letter-spacing: -.055em; max-width: 12ch; color: white; }
        .visual-bottom h1 strong { color: #5fe3b0; }
        .visual-bottom > p:not(.visual-eyebrow) { margin: 13px 0 0; max-width: 43ch; color: rgba(255,255,255,.64); font-size: 14px; line-height: 1.55; }
        .visual-note { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; align-items: center; }
        .visual-note span { font-size: 12px; color: rgba(255,255,255,.72); font-weight: 500; }
        .visual-note span:not(:last-child)::after { content: '•'; margin-left: 12px; color: rgba(255,255,255,.4); }
        .form-side { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 54px 7vw; background: var(--color-paper); }
        .form-wrap { width: min(100%,460px); }
        .auth-brand { align-items: center; color: var(--color-ink); display: flex; gap: 14px; justify-content: center; margin: 0 auto 48px; width: max-content; font-family: "Space Grotesk", var(--font-sans), sans-serif; font-size: 30px; font-weight: 800; letter-spacing: .14em; line-height: 1; text-transform: uppercase; }
        .auth-brand .brand-mark { width: 50px; height: 50px; color: var(--color-teal); }
        .auth-brand:hover { color: var(--color-teal); }
        .brand { align-items: center; color: var(--color-ink); display: inline-flex; gap: 10px; font-size: 18px; font-weight: 700; letter-spacing: -.035em; text-decoration: none; }
        .brand-mark { width: 31px; height: 31px; }
        .form-eyebrow { color: var(--color-ink-4); font: 600 10px var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
        .form-wrap h2 { color: var(--color-ink); font-size: clamp(36px,4.2vw,48px); line-height: 1.02; letter-spacing: -.05em; margin: 12px 0 0; }
        .sub { color: var(--color-ink-3); margin: 11px 0 0; font-size: 15px; line-height: 1.6; }
        .sub strong { color: var(--color-ink); font-weight: 700; overflow-wrap: anywhere; }
        .form { margin-top: 30px; }
        .field { display: grid; gap: 7px; margin-top: 17px; }
        .field label { color: var(--color-ink); font-size: 13px; font-weight: 650; }
        .input-wrap { position: relative; }
        .mail-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--color-ink-4); pointer-events: none; }
        .input { width: 100%; height: 54px; border: 1px solid var(--color-line-strong); border-radius: 11px; background: var(--color-paper); padding: 0 14px 0 45px; color: var(--color-ink); outline: 0; transition: border-color .2s,box-shadow .2s; font-family: inherit; font-size: 15px; }
        .input:focus { border-color: var(--color-teal); box-shadow: 0 0 0 4px rgba(23,107,91,.1); }
        .input:disabled { opacity: .6; }
        .submit { width: 100%; height: 54px; margin-top: 22px; border: 0; border-radius: 11px; background: var(--color-teal); color: #fff; font-weight: 700; cursor: pointer; box-shadow: 0 11px 24px rgba(23,107,91,.16); transition: .24s cubic-bezier(.22,1,.36,1); font-family: inherit; font-size: 15px; }
        .submit:hover:not(:disabled) { background: var(--color-teal-deep); transform: translateY(-2px); box-shadow: 0 15px 30px rgba(23,107,91,.22); }
        .submit:disabled { opacity: .6; cursor: not-allowed; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .back-link { align-items: center; color: var(--color-teal); display: inline-flex; gap: 7px; font-size: 13px; font-weight: 700; text-decoration: none; }
        .back-link:hover { color: var(--color-teal-deep); }
        .top-back { color: var(--color-ink-3); font-weight: 500; margin-bottom: 31px; }
        .top-back:hover { color: var(--color-ink); }
        .signup { margin-top: 20px; text-align: center; color: var(--color-ink-3); font-size: 13px; }
        .signup a { color: var(--color-teal); font-weight: 700; text-decoration: none; }
        .fineprint,.helper { color: var(--color-ink-4); font-size: 11px; line-height: 1.55; }
        .fineprint { margin-top: 28px; }
        .status-msg { min-height: 18px; margin-top: 11px; font-size: 12px; }
        .error-msg { color: var(--color-danger); margin: 0 0 12px; }
        .success-icon { align-items: center; background: var(--color-teal-soft); border: 1px solid rgba(23,107,91,.18); border-radius: 16px; color: var(--color-teal); display: flex; height: 58px; justify-content: center; margin-bottom: 30px; width: 58px; }
        .success-icon :global(svg) { height: 29px; width: 29px; }
        .helper { margin-top: 18px; max-width: 42ch; }
        .success-state .back-link { margin-top: 30px; }
        @media (max-width:900px) { .page { grid-template-columns: 1fr; } .visual { display: none; } .form-side { min-height: 100vh; padding: 36px 24px; } .auth-brand { display: flex; font-size: 24px; gap: 10px; margin: 0 0 42px; } .auth-brand .brand-mark { width: 38px; height: 38px; } .form-wrap h2 { font-size: 38px; } .form { margin-top: 24px; } }
        @media (max-width:520px) { .form-side { padding: 28px 18px; } .auth-brand { margin-bottom: 30px; } .form-wrap h2 { font-size: 38px; } }
        @media (prefers-reduced-motion:reduce) { .submit,.input { transition: none; } .spinner { animation: none; } }
      `}</style>
    </main>
  );
}
