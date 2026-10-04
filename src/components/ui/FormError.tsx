'use client';

interface FormErrorProps {
  message?: string;
  messages?: string[];
}

/**
 * FormError - Display validation errors
 * Handles both single and multiple error messages
 */
export function FormError({ message, messages }: FormErrorProps) {
  if (!message && !messages?.length) return null;

  const errors = message ? [message] : messages || [];

  return (
    <div
      className="rounded-lg border border-danger/30 bg-danger-soft p-3"
      role="alert"
      aria-live="assertive"
    >
      {errors.length === 1 ? (
        <p className="text-sm text-danger">{errors[0]}</p>
      ) : (
        <ul className="space-y-1 text-sm text-danger">
          {errors.map((error, index) => (
            <li key={index} className="flex gap-2">
              <span>•</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
