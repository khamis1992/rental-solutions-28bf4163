
// Basic customer status type
export type CustomerStatus = 
  | 'pending_review' 
  | 'active' 
  | 'inactive' 
  | 'blacklisted' 
  | 'pending_payment'
  | 'blocked';

export interface CustomerInfo {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  phone_number?: string; // Including both forms for compatibility
  address?: string;
  driver_license?: string;
  nationality?: string;
  notes?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFormData {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  driver_license?: string;
  nationality?: string;
  status?: CustomerStatus;
  notes?: string;
}

export interface CustomerUpdateData extends Partial<CustomerFormData> {
  id: string;
}
