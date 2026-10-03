'use client';

/**
 * SettingToggle – Reusable toggle component for settings pages
 * Combines checkbox input with descriptive label and helper text
 * Used in communication/privacy preferences
 */

interface SettingToggleProps {
  id: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function SettingToggle({
  id,
  label,
  description,
  defaultChecked = false,
  disabled = false,
  onChange,
  className = '',
}: SettingToggleProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer py-2 ${className}`}>
      <input
        id={id}
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 mt-0.5 accent-teal disabled:accent-line disabled:cursor-not-allowed"
        aria-label={label}
      />
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium text-sm ${disabled ? 'text-ink-3' : 'text-ink'}`}
        >
          {label}
        </div>
        {description && (
          <div className={`text-xs ${disabled ? 'text-ink-4' : 'text-line'}`}>
            {description}
          </div>
        )}
      </div>
    </label>
  );
}
