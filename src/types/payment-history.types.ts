
import { DbId, PaymentStatus } from '@/types/database-common';

export interface PaymentHistoryItem {
  id: string;
  agreement_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  date: string;
  method?: string;
  reference?: string;
}

export interface Payment {
  id: DbId;
  lease_id?: DbId;
  amount: number;
  amount_paid?: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus;
  payment_method?: string | null;
  description?: string | null;
  type?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | null;
  transaction_id?: string | null;
  import_reference?: string | null;
  balance?: number;
  include_late_fee?: boolean;
  is_partial?: boolean;
}
