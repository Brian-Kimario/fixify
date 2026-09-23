'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { type Profile } from '@/types/auth';
import { updateProfile } from './actions';

interface EditProfileFormProps {
  initialProfile: Profile;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: initialProfile.full_name || '',
    phone: initialProfile.phone || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/app/profile');
        }, 2000);
      } else {
        setError(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-mint/10 border border-mint/30 text-mint text-sm">
          ✅ Profile updated successfully! Redirecting...
        </div>
      )}

      <Input
        type="text"
        name="fullName"
        label="Full Name"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleChange}
        disabled={isLoading}
      />

      <Input
        type="tel"
        name="phone"
        label="Phone Number (Optional)"
        placeholder="+1 (555) 123-4567"
        value={formData.phone}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
