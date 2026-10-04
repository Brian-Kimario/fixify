import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2 bg-paper border border-line rounded-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-teal transition-colors font-body text-sm ${props.className || ''}`}
    />
  );
}
