
export interface PaymentHistoryItem {
  id: string;
  amount: number;
  amount_paid?: number;
  payment_date?: string | Date;
  due_date?: string | Date;
  status: string;
  lease_id?: string;
  type?: string;
  description?: string;
  payment_method?: string;
  transaction_id?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  balance?: number;
  next_payment_date?: string | Date;
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[];
  error: any | null;
}

export interface PaymentSchedule {
  id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: string;
  actual_payment_date?: string;
  transaction_id?: string;
  late_fee_applied?: number;
  balance?: number;
}
