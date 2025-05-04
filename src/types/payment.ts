
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'failed';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | Date | null;
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string;
  type?: string;
  status?: PaymentStatus;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
  include_late_fee?: boolean;
  is_partial?: boolean;
}
