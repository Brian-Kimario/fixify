'use client';

import { useState } from 'react';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

/**
 * SettingToggleClient – Interactive toggle component with database persistence
 * Automatically saves preference changes to the user's profile
 * Shows loading state and handles errors gracefully
 */

interface SettingToggleClientProps {
  id: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  settingKey: string;
  className?: string;
}

export function SettingToggleClient({
  id,
  label,
  description,
  defaultChecked = false,
  settingKey,
  className = '',
}: SettingToggleClientProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (newChecked: boolean) => {
    setChecked(newChecked);
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabase();

      // Get current profile to preserve other notification preferences
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // Fetch with raw query to avoid type issues
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        setError('Failed to load preferences');
        setChecked(!newChecked);
        setIsLoading(false);
        return;
      }

      const currentPrefs = (data as any)?.notification_preferences || {};
      
      // Update the specific preference
      const updatedPrefs = {
        ...currentPrefs,
        [settingKey]: newChecked,
      };

      // Save back to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs } as any)
        .eq('id', user.id);

      if (updateError) {
        setError('Failed to save preference');
        setChecked(!newChecked); // Revert on error
      }
    } catch (err) {
      setError('An error occurred');
      setChecked(!newChecked); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <label className={`flex items-start gap-3 cursor-pointer py-2 ${className}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={isLoading}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-teal disabled:accent-line disabled:cursor-not-allowed"
          aria-label={label}
        />
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm flex items-center gap-2 ${isLoading ? 'text-ink-3' : 'text-ink'}`}>
            {label}
            {isLoading && <span className="text-xs text-ink-4">(saving...)</span>}
            {!isLoading && checked && <span className="text-xs text-teal font-semibold">✓</span>}
          </div>
          {description && (
            <div className={`text-xs ${isLoading ? 'text-ink-4' : 'text-ink-4'}`}>
              {description}
            </div>
          )}
          {error && <div className="text-xs text-danger mt-1">{error}</div>}
        </div>
      </label>
    </div>
  );
}
