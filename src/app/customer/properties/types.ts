export interface Address {
  id: string;
  label: string;
  city: string;
  address_line_1: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Property {
  id: string;
  name: string;
  property_type: string;
  address: Address;
  created_at?: string;
  updated_at?: string;
}
