
import { Agreement } from '@/types/agreement';
import { LeaseStatus } from '@/types/lease-types';

export interface SimpleAgreement {
  id: string;
  status: LeaseStatus;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  total_amount: number;
  rent_amount?: number;
  payment_frequency?: string;
  payment_day?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  agreement_number?: string;
  agreement_type?: string;
  next_payment_date?: string;
  last_payment_date?: string;
  notes?: string;
  customers?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    color?: string;
    vehicle_type?: string;
  };
  customer_name?: string;
  payments?: any[];
  daily_late_fee?: number;
  deposit_amount?: number;
  remaining_amount?: number;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  due_date: string | null;
  status: string;
  payment_method: string | null;
  description: string | null;
  type: string;
  late_fine_amount: number;
  days_overdue: number;
  original_due_date: string | null;
  transaction_id: string | null;
  [key: string]: any;
}

// Export AgreementStatus type
export type AgreementStatus = LeaseStatus;

// Helper function to convert string to status column
export function asStatusColumn(status: string): LeaseStatus {
  return status as LeaseStatus;
}
