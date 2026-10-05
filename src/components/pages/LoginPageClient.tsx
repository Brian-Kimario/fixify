'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithEmail, signInWithGoogle } from '@/app/auth/actions';
import { Symbol } from '@/components/brand/Symbol';
import { PasswordField } from '@/components/ui/PasswordField';

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '18px', height: '18px', display: 'block' }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.3A10.8 10.8 0 0112 4c5.2 0 9.2 4 10.5 8a11.8 11.8 0 01-3.1 5.1M6.2 6.2A12 12 0 0112 20c1 0 2-.2 2.9-.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S5.2 4 12 4s10.5 8 10.5 8S18.8 20 12 20 1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isLoggedOut = searchParams.get('logged_out') === '1' || searchParams.get('logged_out') === 'true';

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
      // signInWithEmail calls redirect() server-side — it throws NEXT_REDIRECT
      // which Next.js handles as a navigation. We never reach the line below on success.
      await signInWithEmail(email, password, next);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // NEXT_REDIRECT is the expected success path — swallow it
      if (message.includes('NEXT_REDIRECT')) return;
      if (message.includes('Invalid login credentials')) setError('Email or password is incorrect. Please try again.');
      else if (message.includes('Email not confirmed')) setError('Confirm your email before signing in.');
      else setError('We could not sign you in right now. Please try again.');
      setIsLoading(false);
    }
    // Do NOT call setIsLoading(false) on success — keep the spinner while Next.js navigates
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
      if (!message.includes('NEXT_REDIRECT') && !message.includes('redirect')) 
        setError('Google sign-in could not be started. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="page">
      {/* Left Visual */}
      <section className="visual" aria-label="Fixify introduction">
        <Image 
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1800&q=88" 
          alt="Warm contemporary home interior"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="object-cover"
          style={{ filter: 'saturate(0.88) contrast(1.06) brightness(0.78)' }}
        />
        <div className="visual-grid" aria-hidden="true"></div>
        <div className="visual-top">
          <Link className="back" href="/">Back to home</Link>
        </div>
        <div className="visual-bottom">
          <p className="visual-eyebrow">WELCOME HOME</p>
          <h1>Come back to a home that feels <strong>looked after.</strong></h1>
        </div>
      </section>

      {/* Right Form */}
      <section className="form-side">
        <div className="form-wrap">
          <Link className="brand auth-brand" href="/">
            <Symbol size="lg" className="brand-mark" />
            <span>FIXIFY</span>
          </Link>

          <p className="form-eyebrow">WELCOME BACK</p>
          <h2>Sign in to Fixify.</h2>
          <p className="sub">Manage your requests, active work and property records.</p>

          <form className="form" onSubmit={handleEmailSignIn} noValidate>
            <button 
              type="button" 
              onClick={handleGoogleSignIn} 
              disabled={isLoading}
              className="google"
            >
              <GoogleIcon />
              {isLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className="divider"><span>or</span></div>

            {isLoggedOut && !error && (
              <div className="status-msg" style={{ color: '#176B5B', marginBottom: '12px' }}>
                ✓ You are signed out. Sign in to continue.
              </div>
            )}
            {error && (
              <div className="status-msg" style={{ color: '#DC2626', marginBottom: '12px' }}>
                ⚠ {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input 
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                disabled={isLoading}
                required
                style={{ borderColor: emailError ? '#DC2626' : undefined }}
              />
              {emailError && <div className="status-msg">{emailError}</div>}
            </div>

            <div className="field">
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                error={passwordError}
                disabled={isLoading}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <div className="form-meta">
              <label className="remember">
                <input type="checkbox" />
                Remember me
              </label>
              <Link className="forgot" href="/auth/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="submit" disabled={isLoading}>
              {isLoading ? 'Signing you in…' : 'Sign in ↗'}
            </button>
          </form>

          <p className="signup">New to Fixify? <Link href="/auth/register">Create an account</Link></p>
          <p className="fineprint">
            By continuing, you agree to Fixify's <Link href="/terms">terms</Link> and <Link href="/privacy">privacy notice</Link>. 
            Professional access remains subject to separate onboarding and verification.
          </p>
        </div>
      </section>

      <style jsx>{`
        main {
          min-height: 100dvh;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(520px, 1fr);
        }

        .visual {
          position: relative;
          min-height: 100vh;
          padding: 28px;
          overflow: hidden;
          background: var(--color-ink);
        }

        .visual img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.88) contrast(1.06) brightness(0.78);
        }

        .visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(8, 23, 20, 0.22), rgba(8, 23, 20, 0.82)), linear-gradient(90deg, rgba(8, 23, 20, 0.30), rgba(8, 23, 20, 0.08) 70%);
          z-index: 1;
        }

        .visual-grid {
          position: absolute;
          inset: 0;
          z-index: 2;
          background-image: linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
          background-size: 34px 34px;
          opacity: 0.45;
          mask-image: linear-gradient(to bottom, black, transparent 90%);
        }

        .visual-top {
          position: relative;
          z-index: 3;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          gap: 20px;
          color: white;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.035em;
          text-decoration: none;
          color: white;
        }

        .brand-mark {
          width: 31px;
          height: 31px;
          stroke: currentColor;
          fill: none;
          stroke-width: 3.15;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .brand-mark .node {
          fill: #77BFAE;
          stroke: none;
        }

        .back {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.72);
          padding-top: 5px;
          text-decoration: none;
        }

        .visual-bottom {
          color: #FFFFFF;
          position: absolute;
          left: 28px;
          right: 28px;
          bottom: 30px;
          display: block;
          z-index: 3;
          padding: 24px;
          background: linear-gradient(180deg, rgba(8, 23, 20, 0.76), rgba(8, 23, 20, 0.96)); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }

        .visual-eyebrow { margin: 0 0 14px; color: #9be0cf; font: 700 10px var(--font-mono); letter-spacing: .16em; text-transform: uppercase; }
        .visual-bottom h1 {
          color: #FFFFFF;
          margin-top: 0;
          font-size: clamp(38px, 4.3vw, 58px);
          line-height: 1.02;
          letter-spacing: -0.055em;
          max-width: 12ch;
        }

        .visual-bottom h1 strong {
          font-weight: 700;
          color: #5fe3b0;
        }

        .visual-bottom p {
          color: rgba(255, 255, 255, 0.92);
          margin-top: 13px;
          margin-bottom: 0;
          max-width: 43ch;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
        }

        .visual-note {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
          align-items: center;
        }

        .visual-note span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.72);
          font-weight: 500;
        }

        .visual-note span:not(:last-child)::after {
          content: '•';
          margin-left: 12px;
          color: rgba(255, 255, 255, 0.40);
        }

        .form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 54px 7vw;
          background: var(--color-paper);
        }

        .form-wrap {
          width: min(100%, 460px);
        }

        .auth-brand { align-items: center; color: var(--color-ink); display: flex; gap: 16px; justify-content: center; margin: 0 auto 52px; width: 100%; font-family: "Space Grotesk", var(--font-sans), sans-serif; font-size: 38px; font-weight: 800; letter-spacing: .16em; line-height: 1; text-align: center; text-transform: uppercase; }
        .auth-brand .brand-mark { flex: 0 0 auto; width: 64px; height: 64px; color: var(--color-teal); }
        .auth-brand:hover { color: var(--color-teal); }

        .form-eyebrow {
          font: 600 10px var(--font-mono);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-ink-4);
        }

        .form-wrap h2 {
          font-size: clamp(36px, 4.2vw, 48px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          margin-top: 12px;
        }

        .sub {
          color: var(--color-ink-3);
          margin-top: 11px;
          font-size: 15px;
        }

        .form {
          margin-top: 30px;
        }

        .field {
          display: grid;
          gap: 7px;
          margin-top: 17px;
        }

        .field label {
          font-size: 13px;
          font-weight: 650;
        }

        .input-wrap {
          position: relative;
        }

        .input {
          width: 100%;
          height: 54px;
          border: 1px solid var(--color-line-strong);
          border-radius: 11px;
          background: var(--color-paper);
          padding: 0 14px;
          color: var(--color-ink);
          outline: 0;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          font-size: 15px;
        }

        .input:focus {
          border-color: var(--color-teal);
          box-shadow: 0 0 0 4px rgba(23, 107, 91, 0.10);
        }

        .input.password {
          padding-right: 54px;
        }

        .show-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: auto;
          height: auto;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-ink-4);
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }

        .show-pass:hover {
          background: transparent;
          color: var(--color-ink);
        }

        .show-pass svg {
          width: 18px;
          height: 18px;
        }

        .form-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 12px;
        }

        .remember {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-ink-3);
          font-size: 13px;
          cursor: pointer;
        }

        .remember input {
          width: 16px;
          height: 16px;
          accent-color: var(--color-teal);
          cursor: pointer;
        }

        .forgot {
          font-size: 13px;
          color: var(--color-teal);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .submit {
          width: 100%;
          height: 54px;
          margin-top: 22px;
          border: 0;
          border-radius: 11px;
          background: var(--color-teal);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 11px 24px rgba(23, 107, 91, 0.16);
          transition: 0.24s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: inherit;
          font-size: 15px;
        }

        .submit:hover:not(:disabled) {
          background: var(--color-teal-deep);
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(23, 107, 91, 0.22);
        }

        .submit:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
        }

        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-ink-4);
          font-size: 12px;
          margin: 23px 0;
        }

        .divider::before, .divider::after {
          content: '';
          height: 1px;
          background: var(--color-line);
          flex: 1;
        }

        .google {
          width: 100%;
          height: 54px;
          border: 1px solid var(--color-line-strong);
          background: var(--color-paper);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s;
          font-family: inherit;
          font-size: 15px;
          color: var(--color-ink);
          padding: 0;
        }

        .google:hover:not(:disabled) {
          background: #fff;
          border-color: #B8C3BC;
        }

        .google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google svg {
          width: 18px;
          height: 18px;
        }

        .signup {
          margin-top: 20px;
          text-align: center;
          color: var(--color-ink-3);
          font-size: 13px;
        }

        .signup a {
          color: var(--color-teal);
          font-weight: 700;
          text-decoration: none;
        }

        .fineprint {
          margin-top: 28px;
          color: var(--color-ink-4);
          font-size: 11px;
          line-height: 1.55;
        }

        .fineprint a {
          text-decoration: underline;
          text-underline-offset: 2px;
          color: var(--color-teal);
        }

        .status-msg {
          min-height: 18px;
          margin-top: 11px;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .page {
            grid-template-columns: 1fr;
          }

          .visual {
            display: none;
          }

          .form-side {
            min-height: 100vh;
            padding: 36px 24px;
          }

          .auth-brand {
            display: flex;
            font-size: 27px;
            gap: 11px;
            margin: 0 0 42px;
          }
          .auth-brand .brand-mark { width: 44px; height: 44px; }

          .form-wrap h2 {
            font-size: 38px;
          }

          .form {
            margin-top: 24px;
          }

          .form-meta {
            align-items: flex-start;
          }

          .fineprint {
            margin-top: 22px;
          }
        }

        @media (max-width: 520px) {
          .form-side {
            padding: 28px 18px;
          }

          .auth-brand {
            margin-bottom: 30px;
          }

          .form-wrap h2 {
            font-size: 38px;
          }

          .fineprint {
            margin-top: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit, .input, .google {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
