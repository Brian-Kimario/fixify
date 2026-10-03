'use client';

import { ISSUE_TYPES, type IssueType } from '@/lib/support';

interface IssueTypeSelectorProps {
  value: IssueType | '';
  onChange: (type: IssueType) => void;
  error?: string;
}

export function IssueTypeSelector({ value, onChange, error }: IssueTypeSelectorProps) {
  const types: IssueType[] = ['booking', 'payment', 'professional', 'account', 'other'];

  return (
    <div>
      <label className="block text-sm font-medium mb-3">Issue Type</label>
      <div className="space-y-2">
        {types.map((type) => (
          <label key={type} className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="issue-type"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <div className="font-medium">{ISSUE_TYPES[type].label}</div>
              <div className="text-sm text-muted-foreground">{ISSUE_TYPES[type].description}</div>
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
