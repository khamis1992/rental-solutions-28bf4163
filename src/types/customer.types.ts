export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  driver_license?: string;
  nationality?: string;
  notes?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFilterParams {
  search?: string;
  status?: CustomerStatus;
  limit?: number;
  offset?: number;
} 