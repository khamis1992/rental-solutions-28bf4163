
export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
}

export interface CustomerListItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}
