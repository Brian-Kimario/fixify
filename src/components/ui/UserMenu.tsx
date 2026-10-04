'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
export interface UserMenuUser {
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Role label shown in menu (e.g. "Customer", "Professional", "Admin") */
  role?: string;
  /** Avatar URL — shows initials if not provided */
  avatarUrl?: string;
}

export interface UserMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Show a divider above this item */
  dividerBefore?: boolean;
  /** Highlight as destructive (e.g. Sign out) */
  danger?: boolean;
  disabled?: boolean;
}

interface UserMenuProps {
  user: UserMenuUser;
  items: UserMenuItem[];
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

/* ─────────────────────────────────────────────────────────────────────────────
   UserMenu
───────────────────────────────────────────────────────────────────────────── */
/**
 * UserMenu — avatar dropdown for authenticated user actions
 *
 * @example
 * <UserMenu
 *   user={{ name: 'Priya K.', email: 'priya@example.com', role: 'Customer' }}
 *   items={[
 *     { label: 'Account settings', href: '/customer/settings' },
 *     { label: 'Sign out', onClick: signOut, danger: true, dividerBefore: true },
 *   ]}
 * />
 */
export function UserMenu({ user, items, className = '' }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* Close on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [open]);

  const initials = getInitials(user.name);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`User menu for ${user.name}`}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-base px-2 py-1.5 hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 transition-colors duration-150"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal text-xs font-bold"
            aria-hidden="true"
          >
            {initials}
          </span>
        )}

        {/* Name — hidden on small screens */}
        <span className="hidden sm:block text-sm font-medium text-ink truncate max-w-[120px]">
          {user.name}
        </span>

        {/* Chevron */}
        <svg
          className={`hidden sm:block h-3.5 w-3.5 shrink-0 text-ink-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-base border border-line bg-paper shadow-md z-[1060] overflow-hidden"
        >
          {/* User identity */}
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="text-xs text-ink-4 truncate">{user.email}</p>
            {user.role && (
              <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-teal">
                {user.role}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {items.map((item, idx) => {
              const isLast = idx === items.length - 1;
              const key = item.label + idx;

              const itemClass = [
                'flex w-full items-center gap-3 px-4 py-2.5 text-sm',
                'transition-colors duration-100',
                item.danger
                  ? 'text-clay hover:bg-clay-soft focus-visible:bg-clay-soft'
                  : 'text-ink hover:bg-teal-wash focus-visible:bg-teal-wash',
                item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={key}>
                  {item.dividerBefore && (
                    <div className="border-t border-line my-1" role="separator" />
                  )}
                  {item.href && !item.disabled ? (
                    <a
                      href={item.href}
                      role="menuitem"
                      className={itemClass}
                      onClick={() => setOpen(false)}
                      tabIndex={0}
                    >
                      {item.icon && (
                        <span className="h-4 w-4 shrink-0 text-ink-4" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => {
                        if (!item.disabled) {
                          setOpen(false);
                          item.onClick?.();
                        }
                      }}
                      className={itemClass}
                      tabIndex={isLast ? 0 : 0}
                    >
                      {item.icon && (
                        <span className="h-4 w-4 shrink-0 text-ink-4" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
