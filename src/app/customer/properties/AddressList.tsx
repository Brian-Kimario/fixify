'use client';

import { useState, useTransition } from 'react';
import { ConfirmationModal } from '@/components/ui/Modal';
import { deleteAddress } from './actions';
import type { Address } from './types';

interface AddressListProps {
  addresses: Address[];
}

export function AddressList({ addresses: initialAddresses }: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = (addr: Address) => {
    setAddressToDelete(addr);
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleConfirmDelete = () => {
    if (!addressToDelete) return;

    startTransition(async () => {
      try {
        await deleteAddress(addressToDelete.id);
        // Remove from list
        setAddresses(addresses.filter((a) => a.id !== addressToDelete.id));
        setShowDeleteConfirm(false);
        setAddressToDelete(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete address';
        setError(msg);
      }
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
    setError(null);
  };

  return (
    <>
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-5 md:p-6 hover:border-[#176B5B] transition"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#18211F] text-base">{addr.label}</h3>
                <p className="text-sm text-[#5A6661] mt-1">{addr.address_line_1}</p>
                <p className="text-sm text-[#5A6661]">{addr.city}</p>
                {addr.latitude && addr.longitude && (
                  <p className="text-xs text-[#7C8681] mt-2">
                    📍 {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="px-3 py-2 text-sm font-bold text-[#176B5B] border border-[#D9DED8] rounded-lg hover:bg-[#F1EEE5] transition">
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(addr)}
                  disabled={isPending}
                  className="px-3 py-2 text-sm font-bold text-[#A9523D] border border-[#DFC0B7] rounded-lg hover:bg-[#F3E1DA] transition disabled:opacity-60"
                  aria-label={`Delete address ${addr.label}`}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Error message for this address */}
            {error && addressToDelete?.id === addr.id && (
              <div className="mt-3 text-xs text-[#A9523D] bg-[#F3E1DA] border border-[#DFC0B7] rounded p-2">
                {error}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && addressToDelete && (
        <ConfirmationModal
          title="Delete address?"
          body={`This will permanently delete "${addressToDelete.label}". You can add it again later if needed.`}
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
