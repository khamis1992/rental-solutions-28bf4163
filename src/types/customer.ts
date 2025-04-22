
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  driver_license?: string;
  address?: string;
  full_name?: string;
  nationality?: string;
}

export interface CustomerProfile extends Omit<Customer, 'first_name' | 'last_name'> {
  full_name: string;
}
