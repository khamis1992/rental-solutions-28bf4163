
// If the file doesn't exist yet, let's create it with a proper Agreement interface
import { LeaseStatus } from '@/lib/database/utils';

export interface Agreement {
  id: string;
  status: LeaseStatus;
  customer_id: string;
  vehicle_id: string;
  start_date?: string;
  end_date?: string;
  total_amount: number;
  rent_amount?: number;
  payment_frequency: string;
  payment_day: number;
  created_at: string;
  updated_at: string;
  agreement_number?: string;
  agreement_type?: string;
  next_payment_date?: string;
  last_payment_date?: string;
  notes?: string;
  customer?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    color?: string;
  };
  payments?: any[];
  daily_late_fee?: number;
  deposit_amount?: number;
  remaining_amount?: number;
}

// Add any other agreement-related types here
export interface AgreementDetail extends Agreement {
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    status: string;
  }[];
}
