
// Basic database types for compatibility
export interface Agreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  deposit_amount?: number;
  status: string;
  terms?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SimpleAgreement extends Agreement {
  confirmation_email_sent?: boolean;
  down_payment?: number;
  customer_name?: string;
  vehicle_license_plate?: string;
  // Add other specific fields as needed
}

export interface Customer {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  driver_license?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
  rent_amount?: number;
  created_at?: string;
  updated_at?: string;
}

// Add other types as needed
export type ExtendedVehicle = Vehicle & {
  current_agreement_id?: string;
  maintenance_status?: string;
};
