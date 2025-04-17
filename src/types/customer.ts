
export type CustomerStatus = 'pending_review' | 'active' | 'inactive' | 'blocked' | 'archived' | 'blacklisted' | 'pending_payment';

export interface CustomerListItem {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  driver_license?: string;
  address?: string;
  status: CustomerStatus;
  created_at: string;
  nationality?: string;
}

export interface CustomerInfo {
  id?: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}
