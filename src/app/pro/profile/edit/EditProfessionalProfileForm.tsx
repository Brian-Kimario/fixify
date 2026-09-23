'use client';

import { useState } from 'react';
import { Card, Button, Input, Label } from '@/components/ui';
import Link from 'next/link';

interface EditProfessionalProfileFormProps {
  initialProfile: any;
}

export function EditProfessionalProfileForm({
  initialProfile,
}: EditProfessionalProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name || '',
    phone: initialProfile?.phone || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Replace with actual API call
      console.log('Submitting profile update:', formData);

      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <Card className="bg-mint/10 border-mint/30">
          <div className="flex items-center gap-3 text-mint">
            <span className="text-xl">✓</span>
            <p>Profile updated successfully!</p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <p className="text-red-500">{error}</p>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <div className="space-y-6">
          <h2 className="font-display font-bold text-xl text-ink">Basic Information</h2>

          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Professional Info */}
      <Card>
        <div className="space-y-6">
          <h2 className="font-display font-bold text-xl text-ink">Professional Information</h2>

          <p className="text-line text-sm">
            Additional fields like bio, skills, and rates can be managed through your profile page. More features coming soon!
          </p>
        </div>
      </Card>

      {/* Actions */}
      <Card className="bg-panel">
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/pro/profile" className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </Card>
    </form>
  );
}
