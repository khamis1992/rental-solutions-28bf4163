
export interface Payment {
  id: string;
  lease_id?: string;
  amount: number;
  amount_paid?: number;
  payment_date?: string | Date | null;
  due_date?: string | Date | null;
  status: string;
  payment_method?: string | null;
  description?: string | null;
  type?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | Date | null;
  transaction_id?: string | null;
  import_reference?: string | null;
  balance?: number;
  include_late_fee?: boolean;
  is_partial?: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  agreement_id: string; 
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  date: string;
  method?: string;
  reference?: string;
}
