
// Simple Agreement type for basic agreement operations
export interface SimpleAgreement {
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
  
  // Relationship data
  customers?: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
  };
  vehicles?: {
    id: string;
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    color?: string;
    vin?: string;
  };
  
  // Computed fields
  customer_name?: string;
  vehicle_info?: string;
}
