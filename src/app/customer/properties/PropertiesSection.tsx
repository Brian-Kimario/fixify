'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/components/ui/Modal';
import { PropertyFormModal } from './PropertyFormModal';
import { deleteProperty, updatePropertyStatus } from './actions';
import type { Property, Address } from './types';

interface PropertiesSectionProps {
  initialProperties: Property[];
  addresses: Address[];
}

export function PropertiesSection({
  initialProperties,
  addresses,
}: PropertiesSectionProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAddProperty = () => {
    setPropertyToEdit(null);
    setShowPropertyModal(true);
    setError(null);
  };

  const handleEditProperty = (property: Property) => {
    setPropertyToEdit(property);
    setShowPropertyModal(true);
    setError(null);
  };

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleConfirmDelete = () => {
    if (!propertyToDelete) return;

    startTransition(async () => {
      try {
        await deleteProperty(propertyToDelete.id);
        setProperties(properties.filter((p) => p.id !== propertyToDelete.id));
        setShowDeleteConfirm(false);
        setPropertyToDelete(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete property';
        setError(msg);
      }
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPropertyToDelete(null);
    setError(null);
  };

  const handleViewJobs = (propertyId: string) => {
    router.push(`/customer/bookings?property_id=${propertyId}`);
  };

  const handleStatusChange = (propertyId: string, newStatus: 'active' | 'inactive' | 'maintenance') => {
    startTransition(async () => {
      try {
        await updatePropertyStatus(propertyId, newStatus);
        setProperties(
          properties.map((p) =>
            p.id === propertyId ? { ...p, status: newStatus } : p
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update status';
        setError(msg);
      }
    });
  };

  return (
    <>
      <div className="px-4 md:px-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#18211F]">Properties</h2>
            <p className="text-xs text-[#7C8681] mt-1">
              {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} registered
            </p>
          </div>
          <button
            onClick={handleAddProperty}
            className="px-4 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition"
          >
            + Add Property
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[#DFC0B7] bg-[#F3E1DA] p-4">
            <p className="text-sm text-[#A9523D] font-bold">Error</p>
            <p className="text-sm text-[#8B4A31]">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs underline text-[#8B4A31]"
            >
              Dismiss
            </button>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#E2EEE9] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-[#176B5B]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            </div>
            <p className="text-[#18211F] font-bold text-lg mb-1">No properties yet</p>
            <p className="text-[#5A6661] text-sm">
              Add your first property to get started with service requests and track
              maintenance history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {properties.map((property) => {
              const currentStatus = property.status || 'active';
              const address = Array.isArray(property.address)
                ? property.address[0]
                : property.address;

              return (
                <div
                  key={property.id}
                  className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-5 md:p-6 hover:border-[#176B5B] hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#18211F]">{property.name}</h3>
                      <p className="text-xs text-[#7C8681] uppercase tracking-[0.05em] mt-1 capitalize">
                        {property.property_type}
                      </p>
                    </div>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(property.id, e.target.value as 'active' | 'inactive' | 'maintenance')}
                      disabled={isPending}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg flex-shrink-0 transition border ${
                        currentStatus === 'active'
                          ? 'bg-[#E2EEE9] text-[#176B5B] border-[#B8D9D3]'
                          : currentStatus === 'inactive'
                          ? 'bg-[#F3E1DA] text-[#A9523D] border-[#DFC0B7]'
                          : 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]'
                      } disabled:opacity-50`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  {address && (
                    <div className="mb-4 p-3 bg-[#F7F4EC] rounded-lg">
                      <div className="flex items-start gap-2.5">
                        <svg
                          className="w-4 h-4 text-[#176B5B] mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#7C8681] uppercase tracking-[0.05em]">
                            Address
                          </p>
                          <p className="text-sm font-semibold text-[#18211F] mt-0.5 truncate">
                            {address.label}
                          </p>
                          <p className="text-xs text-[#5A6661] truncate">
                            {address.address_line_1}
                          </p>
                          <p className="text-xs text-[#5A6661] truncate">{address.city}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-[#D9DED8]">
                    <button
                      onClick={() => handleEditProperty(property)}
                      className="flex-1 px-3 py-2 text-sm font-bold text-[#176B5B] border border-[#D9DED8] rounded-lg hover:bg-[#F1EEE5] transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(property)}
                      disabled={isPending}
                      className="px-3 py-2 text-sm font-bold text-[#A9523D] border border-[#DFC0B7] rounded-lg hover:bg-[#F3E1DA] transition disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleViewJobs(property.id)}
                      className="flex-1 px-3 py-2 text-sm font-bold text-white bg-[#176B5B] rounded-lg hover:bg-[#0D5144] transition"
                    >
                      View Jobs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Property Modal */}
      <PropertyFormModal
        isOpen={showPropertyModal}
        initialData={propertyToEdit}
        addresses={addresses}
        onClose={() => {
          setShowPropertyModal(false);
          setPropertyToEdit(null);
        }}
        onSubmit={async (data) => {
          startTransition(async () => {
            try {
              const { createProperty, updateProperty } = await import('./actions');

              if (propertyToEdit) {
                // Edit mode
                await updateProperty(propertyToEdit.id, data);
                const updatedProperty = {
                  ...propertyToEdit,
                  ...data,
                };
                setProperties(
                  properties.map((p) => (p.id === propertyToEdit.id ? updatedProperty : p))
                );
              } else {
                // Add mode
                const newProperty = await createProperty({
                  name: data.name,
                  property_type: data.property_type,
                  address_id: data.address_id,
                  notes: data.notes,
                });
                const address = addresses.find((a) => a.id === data.address_id);
                if (address) {
                  setProperties([
                    {
                      ...newProperty,
                      address: Array.isArray(newProperty.address)
                        ? newProperty.address
                        : address,
                    },
                    ...properties,
                  ]);
                }
              }
              setShowPropertyModal(false);
              setPropertyToEdit(null);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'An error occurred';
              setError(msg);
            }
          });
        }}
        isLoading={isPending}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && propertyToDelete && (
        <ConfirmationModal
          title="Delete property?"
          body={`This will permanently delete "${propertyToDelete.name}". Make sure there are no active jobs before deleting.`}
          isDangerous={true}
          confirmText="Delete"
          cancelText="Keep it"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}
