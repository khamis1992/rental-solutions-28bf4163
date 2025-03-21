
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';

export interface Payment {
  id: string;
  agreement_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  agreement_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
}
