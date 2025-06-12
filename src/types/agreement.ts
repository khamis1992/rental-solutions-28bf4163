
import { Database } from './database';

export type AgreementStatus = 'draft' | 'active' | 'pending' | 'completed' | 'cancelled' | 'expired' | 'closed';
export type AgreementType = 'short_term' | 'lease_to_own';
export type PaymentFrequency = 'monthly' | 'weekly' | 'daily';

export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  agreement_number?: string;
  agreement_type: AgreementType;
  status: AgreementStatus;
  start_date: string;
  end_date: string;
  total_amount: number;
  rent_amount?: number;
  deposit_amount?: number;
  daily_late_fee?: number;
  payment_frequency?: PaymentFrequency;
  payment_day?: number;
  rent_due_day?: number;
  notes?: string;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  confirmation_email_sent?: boolean;
  down_payment?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  
  // Relations
  customers?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    role?: string;
    created_at: string;
    updated_at: string;
    driver_license?: string;
    nationality?: string;
  };
  
  vehicles?: {
    id: string;
    make: string;
    model: string;
    year?: number;
    license_plate?: string;
    vin?: string;
    color?: string;
  };
  
  // Additional properties for CustomerDetail compatibility
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

export interface AgreementFilterParams {
  statuses?: AgreementStatus[];
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}
