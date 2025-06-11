

export type AgreementType = 'short_term' | 'long_term' | 'lease' | 'rental';
export type AgreementStatus = 'active' | 'terminated' | 'pending' | 'expired';

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  role: string;
  created_at: string;
  updated_at: string;
  driver_license: any;
}

export interface Vehicle {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  color?: string;
  vin: string;
  attention_needed_notes: string;
  engine_number: string;
  model_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  agreement_number?: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount?: number;
  customer_id?: string;
  vehicle_id?: string;
  payment_frequency: string;
  payment_day?: number;
  rent_due_day?: number;
  confirmation_email_sent: boolean;
  daily_late_fee?: number;
  deposit_amount?: number;
  down_payment: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  agreement_type: AgreementType;
  total_amount: number;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  
  // Relationship data
  customers?: Customer;
  vehicles?: Vehicle;
  
  // Computed fields
  customer_name?: string;
  vehicle_info?: string;
}

