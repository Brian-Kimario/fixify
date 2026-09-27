'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormError } from '@/components/ui/FormError';
import { Button } from '@/components/ui/Button';
import { type Profile } from '@/types/auth';
import { updateProfile } from './actions';

interface EditProfileFormProps {
  initialProfile: Profile;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  submit?: string;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: initialProfile.full_name || '',
    phone: initialProfile.phone || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
      });

      if (result.success) {
        setSubmitSuccess(true);
        // Auto-redirect after success
        setTimeout(() => {
          router.push('/customer/profile');
        }, 1500);
      } else {
        setErrors({
          submit: result.error || 'Failed to update profile. Please try again.',
        });
      }
    } catch (err) {
      setErrors({
        submit: 'An unexpected error occurred. Please try again.',
      });
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Feedback */}
      {submitSuccess && (
        <div className="rounded-lg border border-success/30 bg-success-soft p-4 text-sm text-ink flex items-center gap-2">
          <span>✓</span>
          <span>Profile updated successfully. Redirecting...</span>
        </div>
      )}

      {/* Submit Error Feedback */}
      {errors.submit && <FormError message={errors.submit} />}

      {/* Full Name Field */}
      <div>
        <FormLabel required>Full Name</FormLabel>
        <FormInput
          type="text"
          name="fullName"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          helperText="Your full name as you'd like it displayed"
          disabled={isLoading}
        />
      </div>

      {/* Phone Number Field */}
      <div>
        <FormLabel optional>Phone Number</FormLabel>
        <FormInput
          type="tel"
          name="phone"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          helperText="Used for service updates and emergency contact"
          disabled={isLoading}
        />
      </div>

      {/* Email Note */}
      <div className="rounded-lg border border-line bg-porcelain p-4">
        <p className="text-sm text-ink-3">
          <span className="font-semibold text-ink-2">📧 Email Address</span>
          {' '}— To change your email, please contact our support team.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t border-line">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
