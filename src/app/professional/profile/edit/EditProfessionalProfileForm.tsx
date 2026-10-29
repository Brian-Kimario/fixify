'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Label, Textarea } from '@/components/ui';
import { updateProfessionalProfileAction } from './actions';

interface FormState {
  fullName: string;
  phone: string;
  bio: string;
  yearsExperience: string;
  categoryIds: string[];
}

interface EditProfessionalProfileFormProps {
  initial: FormState;
  categories: { id: string; name: string }[];
}

export function EditProfessionalProfileForm({
  initial,
  categories,
}: EditProfessionalProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>(initial);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
    setSuccess(false);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfessionalProfileAction(form);
      if (result.success) setSuccess(true);
      else setError(result.error ?? 'Could not save your profile.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <Card className="bg-teal-soft border-teal/30" role="status">
          <p className="text-teal">Profile saved.</p>
        </Card>
      )}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30" role="alert">
          <p className="text-red-500">{error}</p>
        </Card>
      )}

      <Card>
        <div className="space-y-6">
          <h2 className="font-display font-bold text-xl text-ink">Basic Information</h2>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
              maxLength={100}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="mt-2"
            />
            <p className="text-ink-3 text-xs mt-2">Shared with customers once a job is accepted.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-6">
          <h2 className="font-display font-bold text-xl text-ink">Professional Information</h2>
          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Your experience and the kind of work you do best."
              rows={5}
              maxLength={500}
              className="mt-2"
            />
            <p className="text-ink-3 text-xs mt-2">{form.bio.length} / 500 characters</p>
          </div>
          <div>
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input
              id="yearsExperience"
              name="yearsExperience"
              type="number"
              min="0"
              max="60"
              step="1"
              value={form.yearsExperience}
              onChange={handleChange}
              className="mt-2"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-ink">Skills</legend>
            <p className="text-ink-3 text-xs mt-1 mb-3">Select every category you can take jobs in.</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = form.categoryIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selected
                        ? 'bg-teal-soft text-teal border-teal'
                        : 'bg-paper text-ink border-line hover:border-teal'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => toggleCategory(c.id)}
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card className="bg-paper">
        <div className="flex gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/professional/profile" className="flex-1">
            <Button type="button" variant="secondary" size="lg" className="w-full">
              Back
            </Button>
          </Link>
        </div>
      </Card>
    </form>
  );
}
