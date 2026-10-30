import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCustomerShell, one } from '@/lib/services/shell';

/**
 * The customer's properties with their address and booking activity, plus addresses no
 * property uses. RLS limits every query to the signed-in customer's own rows.
 */

export interface PropertyAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  area: string | null;
  city: string;
  stateRegion: string | null;
  postalCode: string | null;
  accessNotes: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PropertyActivity {
  total: number;
  active: number;
  /** Earliest upcoming booking. */
  next: { serviceName: string; scheduledStart: string | null } | null;
  /** Most recent finished or cancelled booking. */
  last: { serviceName: string; scheduledStart: string | null } | null;
}

export interface CustomerProperty {
  id: string;
  name: string;
  propertyType: string;
  notes: string | null;
  createdAt: string | null;
  address: PropertyAddress | null;
  activity: PropertyActivity;
}

export interface CustomerPropertiesOverview {
  properties: CustomerProperty[];
  /** Saved addresses that no property points at. */
  looseAddresses: PropertyAddress[];
  error: boolean;
}

interface AddressRow {
  id: string;
  label: string;
  address_line_1: string;
  address_line_2: string | null;
  area: string | null;
  city: string;
  state_region: string | null;
  postal_code: string | null;
  access_notes: string | null;
  latitude: number | null;
  longitude: number | null;
}

const ADDRESS_COLUMNS =
  'id, label, address_line_1, address_line_2, area, city, state_region, postal_code, access_notes, latitude, longitude';

function toAddress(row: AddressRow): PropertyAddress {
  return {
    id: row.id,
    label: row.label,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    area: row.area,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    accessNotes: row.access_notes,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export const getCustomerPropertiesOverview = cache(async (userId: string): Promise<CustomerPropertiesOverview> => {
  const supabase = await createClient();
  const [propertiesResult, addressesResult, shell] = await Promise.all([
    supabase
      .from('properties')
      .select(`id, name, property_type, notes, created_at, address:addresses!properties_address_id_fkey(${ADDRESS_COLUMNS})`)
      .eq('owner_customer_id', userId)
      .order('created_at', { ascending: true }),
    supabase.from('addresses').select(ADDRESS_COLUMNS).eq('customer_id', userId).order('created_at', { ascending: true }),
    getCustomerShell(userId),
  ]);

  const propertyRows = propertiesResult.data ?? [];
  const usedAddressIds = new Set<string>();

  const properties: CustomerProperty[] = propertyRows.map((row) => {
    const addressRow = one(row.address);
    if (addressRow) usedAddressIds.add(addressRow.id);

    const bookings = shell.bookings.filter((b) => b.propertyId === row.id);
    const upcoming = bookings
      .filter((b) => b.tab === 'upcoming')
      .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))[0];
    const past = bookings
      .filter((b) => b.tab === 'past')
      .sort((a, b) => (b.scheduledStart ?? '').localeCompare(a.scheduledStart ?? ''))[0];

    return {
      id: row.id,
      name: row.name,
      propertyType: row.property_type,
      notes: row.notes,
      createdAt: row.created_at,
      address: addressRow ? toAddress(addressRow) : null,
      activity: {
        total: bookings.length,
        active: bookings.filter((b) => b.tab === 'active').length,
        next: upcoming ? { serviceName: upcoming.serviceName, scheduledStart: upcoming.scheduledStart } : null,
        last: past ? { serviceName: past.serviceName, scheduledStart: past.scheduledStart } : null,
      },
    };
  });

  return {
    properties,
    looseAddresses: (addressesResult.data ?? []).filter((a) => !usedAddressIds.has(a.id)).map(toAddress),
    error: Boolean(propertiesResult.error || addressesResult.error || shell.error),
  };
});
