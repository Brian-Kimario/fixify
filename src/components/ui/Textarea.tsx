import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2 bg-dark border border-line rounded-lg text-ink placeholder-line/50 focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint/20 transition-colors font-body text-sm ${props.className || ''}`}
    />
  );
}
