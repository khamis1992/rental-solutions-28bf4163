
export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
}

// Add a utility type for the extended payment interface
export interface ExtendedPayment extends Payment {
  id: string;
  lease_id?: string;
  amount: number;
  amount_paid?: number;
  balance?: number;
  payment_date: string | null;
  due_date?: string | null;
  status?: string;
  payment_method?: string | null;
  description?: string | null;
  type?: string;
  days_overdue?: number;
}
