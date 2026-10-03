'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SimpleModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/customer/PropertyCard';
import { PropertyForm, type PropertyFormData } from '@/components/customer/PropertyForm';
import { createProperty } from './actions';
import type { Property, Address } from './types';

interface PropertiesClientProps {
  initialProperties: Property[];
  addresses: Address[];
}

export function PropertiesClient({
  initialProperties,
  addresses,
}: PropertiesClientProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();
  const router = useRouter();

  const handleOpenModal = (property?: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(undefined);
  };

  const handleSubmitForm = async (formData: PropertyFormData) => {
    try {
      const newProperty = await createProperty({
        name: formData.name,
        property_type: formData.property_type,
        address_id: formData.address_id,
        notes: formData.notes,
      });

      // Add the new property to the list
      setProperties([newProperty, ...properties]);
      handleCloseModal();
    } catch (error) {
      throw error;
    }
  };

  const handleBookService = (_property: Property) => {
    router.push('/customer/bookings/new');
  };

  const handleEditProperty = (property: Property) => {
    handleOpenModal(property);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
        {/* Header with back link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <Link
              href="/customer"
              className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1 mb-2"
            >
              ← Back to Residence Console
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Registered Properties
            </h1>
            <p className="text-sm text-ink-3 mt-1">
              Properties registered to your account with verified permanent service passports
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="text-xs"
            >
              + Register New Property
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              Your Dwellings
            </h2>
            <span className="font-mono text-xs text-ink-4">
              {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} registered
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="bg-paper rounded-2xl border-2 border-dashed border-line p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-ink-4 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-3m0 0l7-4 7 4M5 9v7a1 1 0 001 1h12a1 1 0 001-1V9m-9 4l4-2m0 0l4 2m-4-2v4"
                />
              </svg>
              <h3 className="font-display font-bold text-lg text-ink">
                No properties registered yet
              </h3>
              <p className="text-ink-3 text-sm mt-1 max-w-md mx-auto">
                Add your residence to track automated maintenance history, book emergency
                dispatches, and maintain warranties.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenModal()}
                className="text-xs mt-4"
              >
                Register First Property
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onBook={handleBookService}
                  onEdit={handleEditProperty}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Property Form Modal */}
      <SimpleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedProperty ? 'Edit Property' : 'Register New Property'}
      >
        <PropertyForm
          property={selectedProperty}
          addresses={addresses}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
        />
      </SimpleModal>
    </>
  );
}
