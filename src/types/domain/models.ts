
import { DbId } from '../database-common';

export type PaymentFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface BaseEntity {
  id: DbId;
  created_at: string;
  updated_at: string;
}

export interface Agreement extends BaseEntity {
  agreement_number: string;
  customer_id: DbId;
  vehicle_id: DbId;
  status: AgreementStatus;
  start_date: string | null;
  end_date: string | null;
  rent_amount: number;
  total_amount: number;
  deposit_amount: number | null;
  daily_late_fee: number | null;
  agreement_type: 'short_term' | 'long_term' | 'rental' | 'lease_to_own';
  agreement_duration: string;
  payment_frequency: PaymentFrequency;
  payment_day: number;
  notes: string | null;
  last_payment_date: string | null;
  
  // Add fields for the ImportHistoryItem component
  row_count?: number;
  processed_count?: number;
  failed_records?: number;
  total_records?: number;
  
  // Add fields for nested objects often populated from database joins
  customers?: {
    id: DbId;
    full_name: string;
    email?: string;
    phone_number?: string;
  };
  vehicles?: {
    id: DbId;
    make: string;
    model: string;
    license_plate: string;
    image_url?: string;
    year?: number;
    color?: string;
  };
}

export type AgreementStatus = 
  | 'draft'
  | 'pending'
  | 'active' 
  | 'completed'
  | 'cancelled'
  | 'terminated'
  | 'pending_payment'
  | 'pending_deposit'
  | 'archived'
  | 'closed';

export interface Payment extends BaseEntity {
  lease_id: DbId;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  payment_method?: string | null;
  status: string;
  description?: string | null;
  type?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | null;
  transaction_id?: string | null;
  reference_number?: string | null;
}

export interface ImportHistoryItem extends BaseEntity {
  file_name: string;
  status: string;
  error_count?: number;
  processed_count?: number;
  row_count?: number;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
}
