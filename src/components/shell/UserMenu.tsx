'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/auth/signout-action';
import { Popover } from './Popover';

export interface UserMenuLink {
  label: string;
  href: string;
}

/**
 * Account menu for the customer and professional shells. Keeps the accessible names
 * ("User menu", "Log Out") of the shared SignOutMenu, which admin still uses.
 */
export function UserMenu({
  displayName,
  email,
  initials,
  roleLabel,
  links,
}: {
  displayName: string;
  email: string | null;
  initials: string;
  roleLabel: string;
  links: UserMenuLink[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function signOut() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (result && result.success === false) {
          setError(result.error ?? 'Sign-out failed. Please try again.');
          return;
        }
      } catch (err) {
        // A successful sign-out redirects, which surfaces here as NEXT_REDIRECT.
        if (!(err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
          setError('Sign-out failed. Please try again.');
          return;
        }
      }
      router.replace('/auth/login?logged_out=1');
      router.refresh();
    });
  }

  return (
    <Popover
      triggerLabel="User menu"
      triggerClassName="flex min-h-11 items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      trigger={
        <>
          <span className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-teal-soft text-xs font-bold text-teal-deep">
            {initials}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-ink-3 sm:block" aria-hidden="true" />
        </>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 border-b border-line p-4">
            <span className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-teal-soft text-sm font-bold text-teal-deep">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              {email && <p className="truncate text-xs text-ink-3">{email}</p>}
              <p className="mt-0.5 text-xs font-medium text-teal">{roleLabel}</p>
            </div>
          </div>

          <ul className="py-1.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex min-h-11 items-center px-4 text-sm text-ink transition-colors hover:bg-porcelain focus-visible:bg-porcelain focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-line p-3">
            {error && (
              <p role="alert" className="mb-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={signOut}
              disabled={pending}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-porcelain text-sm font-medium text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {pending ? 'Signing out…' : 'Log Out'}
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}
