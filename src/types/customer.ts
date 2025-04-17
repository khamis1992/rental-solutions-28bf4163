
export type CustomerStatus = 'active' | 'inactive' | 'pending_review' | 'blacklisted' | 'pending_payment';

export interface CustomerInfo {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string; // Added to support both property names
  address?: string;
  nationality?: string;
  driver_license?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

export interface CustomerFilterParams {
  status?: CustomerStatus | string;
  search?: string;
}

export interface CustomerFormData {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  nationality?: string;
  driver_license?: string;
  status?: CustomerStatus;
  notes?: string;
}
