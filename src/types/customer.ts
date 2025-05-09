
export interface Customer {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  driver_license?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Add CustomerInfo interface that's being used across the application
export interface CustomerInfo {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  driver_license?: string;
}
