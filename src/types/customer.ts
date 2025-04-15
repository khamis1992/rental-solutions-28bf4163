
export type CustomerStatus = 'active' | 'inactive' | 'pending_review' | 'blacklisted' | 'pending_payment';

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  phone?: string; // Added for compatibility
  driver_license?: string;
  nationality?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerListItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}
