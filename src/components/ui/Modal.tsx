'use client';

interface ConfirmationModalProps {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isDangerous?: boolean;
}

/**
 * ConfirmationModal - Full-screen overlay modal for critical confirmations
 * Displays at bottom on mobile, center on desktop
 * Used for admin interventions, destructive actions, etc.
 */
export function ConfirmationModal({
  title,
  body,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isDangerous = false,
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-4 sm:place-items-center">
      <div
        className="w-full max-w-md rounded-[24px] bg-paper p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-danger">
          Confirm action
        </p>
        <h2 id="modal-title" className="mt-2 font-display text-2xl font-bold text-ink">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-3">{body}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary flex-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn flex-1 ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ActionModal - Specialized confirmation modal for admin actions
 * Legacy alias for ConfirmationModal with danger styling
 */
export function ActionModal({
  title,
  body,
  onCancel,
  onConfirm,
}: Omit<ConfirmationModalProps, 'cancelText' | 'confirmText' | 'isDangerous'>) {
  return (
    <ConfirmationModal
      title={title}
      body={body}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelText="Cancel"
      confirmText="Confirm request"
      isDangerous={true}
    />
  );
}

/**
 * SimpleModal - Flexible modal component for general use
 * Useful for forms, messages, or other content
 */
interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SimpleModal({ isOpen, onClose, title, children }: SimpleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div
        className="w-full max-w-md rounded-[24px] bg-paper p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simple-modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="simple-modal-title" className="font-display text-2xl font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-xl text-ink-3 hover:text-ink"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
