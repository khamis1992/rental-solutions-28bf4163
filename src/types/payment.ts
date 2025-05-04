
import { DbId } from './database-common';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'processing'
  | 'completed'; // Adding 'completed' which is used in AgreementDetail.tsx

export interface Payment {
  id?: DbId;
  lease_id: string;
  amount?: number;
  payment_date?: string | null;
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  status: PaymentStatus;
  is_partial?: boolean;
}
