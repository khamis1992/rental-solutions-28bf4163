
export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  phone?: string; // Added for compatibility
  driver_license?: string;
  nationality?: string;
  address?: string;
  notes?: string; // Added missing property
  status?: string; // Added missing property
  created_at?: string; // Added missing property
  updated_at?: string; // Added missing property
}

export interface CustomerListItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}
