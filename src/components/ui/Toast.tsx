'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast - Transient notification that auto-dismisses
 * Positioned fixed at bottom of screen
 */
export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-success-soft text-success border-success/30',
    error: 'bg-danger-soft text-danger border-danger/30',
    warning: 'bg-ochre-soft text-ochre border-ochre/30',
    info: 'bg-teal-soft text-teal border-teal/30',
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg transition-opacity duration-300 ${typeStyles[type]} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-lg opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer - Manages multiple toasts
 * Use this for a toast notification queue
 */
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
