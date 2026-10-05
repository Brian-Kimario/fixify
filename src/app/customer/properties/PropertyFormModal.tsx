'use client';

import { useState } from 'react';
import { SimpleModal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormError } from '@/components/ui/FormError';
import type { Property, Address } from './types';

interface PropertyFormModalProps {
  isOpen: boolean;
  initialData?: Property | null;
  addresses: Address[];
  onClose: () => void;
  onSubmit: (data: Partial<Property> & { address_id: string }) => Promise<void>;
  isLoading: boolean;
}

const PROPERTY_TYPES = ['residential', 'commercial', 'office', 'retail', 'rental', 'other'];

export function PropertyFormModal({
  isOpen,
  initialData,
  addresses,
  onClose,
  onSubmit,
  isLoading,
}: PropertyFormModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    property_type: initialData?.property_type || '',
    address_id: initialData?.address?.id || '',
    notes: initialData?.notes || '',
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;
  const isFormValid = formData.name.trim() && formData.property_type && formData.address_id;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        property_type: formData.property_type,
        address_id: formData.address_id,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(submitData);
      setFormData({
        name: '',
        property_type: '',
        address_id: '',
        notes: '',
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    }
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Property' : 'Add Property'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}

        <div>
          <FormLabel htmlFor="name" required>
            Property Name
          </FormLabel>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="e.g., Main House, Office Building"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="property_type" required>
            Property Type
          </FormLabel>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FormLabel htmlFor="address_id" required>
            Linked Address
          </FormLabel>
          <select
            id="address_id"
            name="address_id"
            value={formData.address_id}
            onChange={handleChange}
            disabled={isLoading || isEditMode}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          >
            <option value="">Select an address</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.label} — {addr.address_line_1}
              </option>
            ))}
          </select>
          {isEditMode && (
            <p className="mt-1 text-xs text-[#7C8681]">
              Edit addresses in the Saved Addresses section
            </p>
          )}
        </div>

        <div>
          <FormLabel htmlFor="notes" optional>
            Notes
          </FormLabel>
          <textarea
            id="notes"
            name="notes"
            placeholder="Additional details about this property"
            value={formData.notes}
            onChange={handleChange}
            disabled={isLoading}
            rows={3}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm font-bold text-[#176B5B] hover:bg-[#F1EEE5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="flex-1 rounded-lg bg-[#176B5B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0D5144] disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Property' : 'Add Property'}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
