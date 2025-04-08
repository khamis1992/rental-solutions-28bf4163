
import { Vehicle } from './vehicle';
import { Customer } from './customer';

export type LeaseStatus = 
  | "pending" 
  | "pending_payment"
  | "pending_deposit"
  | "active"
  | "cancelled"
  | "closed"
  | "completed"
  | "terminated"
  | "archived";

export type PaymentStatus = 
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded"
  | "completed";

export interface AgreementDocument {
  id: string;
  document_type: string;
  document_url: string;
  created_at: string;
  original_filename?: string;
}

export interface Agreement {
  id: string;
  agreement_number?: string;
  customer_id?: string;
  vehicle_id?: string;
  status?: LeaseStatus;
  start_date?: Date | string;
  end_date?: Date | string;
  rent_amount?: number;
  total_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: PaymentStatus;
  rent_due_day?: number;
  daily_late_fee?: number;
  security_deposit_amount?: number;
  deposit_amount?: number; // alias for security_deposit_amount
  security_deposit_refunded?: boolean;
  security_deposit_refund_date?: string;
  security_deposit_notes?: string;
  payment_schedule_type?: 'monthly' | 'custom';
  customer?: Customer;
  vehicle?: Vehicle;
  documents?: AgreementDocument[];
  terms_accepted: boolean;
  additional_drivers: any[];
}

export interface AgreementImport {
  id: string;
  filename: string;
  status: string;
  total_records: number;
  processed_records: number;
  created_at?: string;
  updated_at?: string;
  error_count?: number;
  errors?: any;
}
