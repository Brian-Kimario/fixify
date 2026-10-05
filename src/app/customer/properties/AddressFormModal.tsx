'use client';

import { useState } from 'react';
import { SimpleModal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormError } from '@/components/ui/FormError';
import type { Address } from './types';

interface AddressFormModalProps {
  isOpen: boolean;
  initialData?: Address | null;
  onClose: () => void;
  onSubmit: (data: Partial<Address>) => Promise<void>;
  isLoading: boolean;
}

export function AddressFormModal({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  isLoading,
}: AddressFormModalProps) {
  const [formData, setFormData] = useState({
    label: initialData?.label || '',
    address_line_1: initialData?.address_line_1 || '',
    city: initialData?.city || '',
    state_region: initialData?.state_region || '',
    postal_code: initialData?.postal_code || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;
  const isFormValid =
    formData.label.trim() && formData.address_line_1.trim() && formData.city.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setError('Please fill in all required fields (Label, Address, City)');
      return;
    }

    try {
      const submitData: Partial<Address> = {
        label: formData.label.trim(),
        address_line_1: formData.address_line_1.trim(),
        city: formData.city.trim(),
        state_region: formData.state_region.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : undefined,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : undefined,
      };

      await onSubmit(submitData);
      setFormData({
        label: '',
        address_line_1: '',
        city: '',
        state_region: '',
        postal_code: '',
        latitude: '',
        longitude: '',
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
      title={isEditMode ? 'Edit Address' : 'Add Address'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}

        <div>
          <FormLabel htmlFor="label" required>
            Label
          </FormLabel>
          <input
            id="label"
            type="text"
            name="label"
            placeholder="e.g., Home, Office"
            value={formData.label}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="address_line_1" required>
            Address
          </FormLabel>
          <input
            id="address_line_1"
            type="text"
            name="address_line_1"
            placeholder="Street address"
            value={formData.address_line_1}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="city" required>
            City
          </FormLabel>
          <input
            id="city"
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="state_region" optional>
            State/Region
          </FormLabel>
          <input
            id="state_region"
            type="text"
            name="state_region"
            placeholder="State or region"
            value={formData.state_region}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="postal_code" optional>
            Postal Code
          </FormLabel>
          <input
            id="postal_code"
            type="text"
            name="postal_code"
            placeholder="Postal code"
            value={formData.postal_code}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="latitude" optional>
            Latitude
          </FormLabel>
          <input
            id="latitude"
            type="number"
            name="latitude"
            placeholder="GPS latitude"
            step="0.0001"
            value={formData.latitude}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-2 w-full rounded-lg border border-[#D9DED8] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B] disabled:opacity-50"
          />
        </div>

        <div>
          <FormLabel htmlFor="longitude" optional>
            Longitude
          </FormLabel>
          <input
            id="longitude"
            type="number"
            name="longitude"
            placeholder="GPS longitude"
            step="0.0001"
            value={formData.longitude}
            onChange={handleChange}
            disabled={isLoading}
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
            {isLoading ? 'Saving...' : isEditMode ? 'Update Address' : 'Add Address'}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
