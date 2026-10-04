'use client';

import { useState } from 'react';
import { Card, Button, Input, Label, Textarea } from '@/components/ui';
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
    bio: initialProfile?.bio || '',
    phone: initialProfile?.phone || '',
    skills: initialProfile?.skills || '',
    location: initialProfile?.location || '',
    hourly_rate: initialProfile?.hourly_rate || '',
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
        <Card className="bg-teal-soft border-teal/30">
          <div className="flex items-center gap-3 text-teal">
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

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Professional Info */}
      <Card>
        <div className="space-y-6">
          <h2 className="font-display font-bold text-xl text-ink">Professional Information</h2>

          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell customers about your experience, expertise, and what makes you unique..."
              rows={5}
              className="mt-2"
            />
            <p className="text-line text-xs mt-2">
              {formData.bio.length} / 500 characters
            </p>
          </div>

          <div>
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              name="skills"
              type="text"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., Plumbing, Repairs, Electrical"
              className="mt-2"
            />
            <p className="text-line text-xs mt-2">
              Add skills that are relevant to the jobs you want to bid on
            </p>
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate (optional)</Label>
            <div className="flex mt-2 gap-2">
              <span className="inline-flex items-center px-3 bg-paper border border-line rounded-lg text-ink">
                $
              </span>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min="0"
                step="5"
                value={formData.hourly_rate}
                onChange={handleChange}
                placeholder="0.00"
                className="flex-1"
              />
              <span className="inline-flex items-center px-3 text-line">/hr</span>
            </div>
            <p className="text-line text-xs mt-2">
              Leave blank if you prefer project-based pricing
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="bg-paper">
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
          <Link href="/professional/profile" className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </Card>
    </form>
  );
}
