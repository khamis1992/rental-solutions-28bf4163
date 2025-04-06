
export interface Payment {
  id: string;
  reference?: string;
  payment_number?: string;
  payment_date: string | Date;
  amount: number;
  payment_method?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial' | string;
  customer_id?: string;
  agreement_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
