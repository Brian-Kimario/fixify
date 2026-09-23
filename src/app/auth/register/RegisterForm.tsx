'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { registerWithEmail } from './actions';

type UserRole = 'customer' | 'professional';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'customer' as UserRole,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'radio') {
      setFormData((prev) => ({
        ...prev,
        role: value as UserRole,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithEmail({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
      });

      if (result.success) {
        router.push('/auth/verify-email');
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      <Input
        type="text"
        name="fullName"
        label="Full name"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      <Input
        type="email"
        name="email"
        label="Email address"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      <Input
        type="password"
        name="password"
        label="Password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isLoading}
        helperText="At least 8 characters"
      />

      <Input
        type="password"
        name="confirmPassword"
        label="Confirm password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      {/* Role Selection */}
      <fieldset className="space-y-3 pt-2">
        <legend className="text-sm font-medium text-ink">I'm signing up as:</legend>

        <div className="flex items-center gap-3">
          <input
            type="radio"
            id="role-customer"
            name="role"
            value="customer"
            checked={formData.role === 'customer'}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 accent-mint cursor-pointer"
          />
          <label htmlFor="role-customer" className="flex-1 cursor-pointer">
            <div className="font-medium text-ink">Customer</div>
            <div className="text-xs text-line">I need property services</div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="radio"
            id="role-professional"
            name="role"
            value="professional"
            checked={formData.role === 'professional'}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 accent-mint cursor-pointer"
          />
          <label htmlFor="role-professional" className="flex-1 cursor-pointer">
            <div className="font-medium text-ink">Professional</div>
            <div className="text-xs text-line">I provide property services</div>
          </label>
        </div>
      </fieldset>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Create account
        </Button>
      </div>
    </form>
  );
}
