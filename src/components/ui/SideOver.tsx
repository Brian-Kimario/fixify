'use client';

import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   SideOver (drawer sliding from the right)
───────────────────────────────────────────────────────────────────────────── */
interface SideOverProps {
  /** Whether the side-over is visible */
  open: boolean;
  /** Called when the overlay or close button is clicked, or Escape is pressed */
  onClose: () => void;
  /** Panel title shown in the header */
  title: string;
  /** Optional subtitle / context label above the title */
  subtitle?: string;
  /** Panel content */
  children: ReactNode;
  /** Width of the panel. Default 'md' */
  width?: 'sm' | 'md' | 'lg' | 'xl';
  /** Actions rendered in the footer */
  footer?: ReactNode;
  className?: string;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * SideOver — right-edge slide-in drawer panel
 *
 * Used for detail views, admin case inspections, and form overlays.
 * Traps focus when open. Closes on Escape or overlay click.
 *
 * @example
 * <SideOver open={isOpen} onClose={() => setOpen(false)} title="Job details">
 *   <p>Content here</p>
 * </SideOver>
 */
export function SideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
  footer,
  className = '',
}: SideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /* Focus the close button when the panel opens */
  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* Keyboard handler — close on Escape, trap Tab inside panel */
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
    if (e.key === 'Tab' && panelRef.current) {
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  if (!open) return null;

  const panel = (
    <div
      className="fixed inset-0 z-[1040] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sideover-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 transition-opacity duration-300 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'relative flex h-full w-full flex-col bg-paper shadow-xl',
          widths[width],
          'translate-x-0 transition-transform duration-300 motion-reduce:transition-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            {subtitle && (
              <p className="mb-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-4">
                {subtitle}
              </p>
            )}
            <h2
              id="sideover-title"
              className="font-display text-xl font-bold text-ink truncate"
            >
              {title}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-base border border-line text-ink-3 hover:text-ink hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 transition-colors duration-150"
            aria-label="Close panel"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
