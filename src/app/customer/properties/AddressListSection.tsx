'use client';

import { useState, useTransition } from 'react';
import { ConfirmationModal } from '@/components/ui/Modal';
import { AddressFormModal } from './AddressFormModal';
import { createAddress, deleteAddress } from './actions';
import { AddressList } from './AddressList';
import type { Address } from './types';

interface AddressListSectionProps {
  initialAddresses: Address[];
}

export function AddressListSection({ initialAddresses }: AddressListSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAddClick = () => {
    setShowAddModal(true);
    setError(null);
  };

  const handleAddSubmit = async (data: Partial<Address>) => {
    startTransition(async () => {
      try {
        const newAddress = await createAddress(data as any);
        setAddresses([newAddress, ...addresses]);
        setShowAddModal(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add address';
        setError(msg);
      }
    });
  };

  return (
    <>
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#18211F]">Saved Addresses</h2>
            <p className="text-xs text-[#7C8681] mt-1">
              {addresses.length} address{addresses.length === 1 ? "" : "es"}
            </p>
          </div>
          <button
            onClick={handleAddClick}
            className="px-4 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition"
          >
            + Add Address
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

        {addresses.length === 0 ? (
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>
            <p className="text-[#18211F] font-bold text-lg mb-1">No saved addresses</p>
            <p className="text-[#5A6661] text-sm">
              Add addresses for quick selection when booking services.
            </p>
          </div>
        ) : (
          <AddressList addresses={addresses} />
        )}
      </div>

      {/* Add Address Modal */}
      <AddressFormModal
        isOpen={showAddModal}
        initialData={null}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        isLoading={isPending}
      />
    </>
  );
}
