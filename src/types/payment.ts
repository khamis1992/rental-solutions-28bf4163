
export interface Payment {
  id?: string;
  lease_id?: string;
  amount: number;
  amount_paid?: number;
  payment_date?: string | Date;
  due_date?: string | Date;
  status?: string;
  payment_method?: string;
  transaction_id?: string;
  description?: string;
  type?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}
