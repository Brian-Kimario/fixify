'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormError } from '@/components/ui/FormError';
import type { Property, Address } from '@/app/customer/properties/types';

interface PropertyFormProps {
  property?: Property;
  addresses: Address[];
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
}

export interface PropertyFormData {
  name: string;
  property_type: string;
  address_id: string;
  notes?: string;
}

interface FormErrors {
  name?: string;
  property_type?: string;
  address_id?: string;
  notes?: string;
  submit?: string;
}

const PROPERTY_TYPES = [
  { value: 'residential', label: 'Residential Home' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export function PropertyForm({
  property,
  addresses,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const isEditing = !!property;

  const [formData, setFormData] = useState<PropertyFormData>({
    name: property?.name || '',
    property_type: property?.property_type || '',
    address_id: property?.address?.id || '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }

    if (!formData.property_type) {
      newErrors.property_type = 'Property type is required';
    }

    if (!formData.address_id) {
      newErrors.address_id = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      if (!isEditing) {
        setFormData({
          name: '',
          property_type: '',
          address_id: '',
          notes: '',
        });
      }

      // Auto-close after success
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save property. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success feedback */}
      {submitSuccess && (
        <div className="rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-ink">
          ✓ Property {isEditing ? 'updated' : 'created'} successfully
        </div>
      )}

      {/* Submit error feedback */}
      {errors.submit && <FormError message={errors.submit} />}

      {/* Property Name */}
      <div>
        <FormLabel required>Property Name</FormLabel>
        <FormInput
          type="text"
          placeholder="e.g., Main Residence, Vacation Home"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          error={errors.name}
          helperText="Give your property a descriptive name"
        />
      </div>

      {/* Property Type */}
      <div>
        <FormLabel required>Property Type</FormLabel>
        <select
          value={formData.property_type}
          onChange={(e) =>
            setFormData({ ...formData, property_type: e.target.value })
          }
          className={`w-full min-h-10 rounded-xl border bg-porcelain px-3 py-2 text-sm outline-none transition ${
            errors.property_type
              ? 'border-danger/50 bg-danger-soft/30 focus:border-danger focus:ring-2 focus:ring-danger/10'
              : 'border-line-strong focus:border-teal focus:ring-4 focus:ring-teal/10'
          }`}
          aria-invalid={!!errors.property_type}
          aria-describedby={errors.property_type ? 'property_type-error' : undefined}
        >
          <option value="">Select property type...</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.property_type && (
          <p id="property_type-error" className="mt-1 text-xs text-danger">
            {errors.property_type}
          </p>
        )}
      </div>

      {/* Address Selection */}
      <div>
        <FormLabel required>Address</FormLabel>
        {addresses.length === 0 ? (
          <div className="rounded-lg border border-line p-4 text-center text-sm text-ink-3">
            <p>No addresses found.</p>
            <p className="text-xs mt-1">
              Please add an address to your profile first.
            </p>
          </div>
        ) : (
          <select
            value={formData.address_id}
            onChange={(e) =>
              setFormData({ ...formData, address_id: e.target.value })
            }
            className={`w-full min-h-10 rounded-xl border bg-porcelain px-3 py-2 text-sm outline-none transition ${
              errors.address_id
                ? 'border-danger/50 bg-danger-soft/30 focus:border-danger focus:ring-2 focus:ring-danger/10'
                : 'border-line-strong focus:border-teal focus:ring-4 focus:ring-teal/10'
            }`}
            aria-invalid={!!errors.address_id}
            aria-describedby={errors.address_id ? 'address_id-error' : undefined}
          >
            <option value="">Select address...</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.address_line_1}, {address.city}
              </option>
            ))}
          </select>
          )}
        {errors.address_id && (
          <p id="address_id-error" className="mt-1 text-xs text-danger">
            {errors.address_id}
          </p>
        )}
      </div>

      {/* Notes / Known Issues */}
      <div>
        <FormLabel optional>Known Issues or Notes</FormLabel>
        <textarea
          placeholder="e.g., Plumbing issues in upstairs bathroom, recent roof repair..."
          value={formData.notes || ''}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          className={`w-full rounded-xl border bg-porcelain px-3 py-2 text-sm outline-none transition resize-none ${
            errors.notes
              ? 'border-danger/50 bg-danger-soft/30 focus:border-danger focus:ring-2 focus:ring-danger/10'
              : 'border-line-strong focus:border-teal focus:ring-4 focus:ring-teal/10'
          }`}
          rows={4}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? 'notes-error' : 'notes-helper'}
        />
        {errors.notes && (
          <p id="notes-error" className="mt-1 text-xs text-danger">
            {errors.notes}
          </p>
        )}
        {!errors.notes && (
          <p id="notes-helper" className="mt-1 text-xs text-ink-4">
            This helps professionals understand your property's history
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-line">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Property'
              : 'Register Property'}
        </Button>
      </div>
    </form>
  );
}
