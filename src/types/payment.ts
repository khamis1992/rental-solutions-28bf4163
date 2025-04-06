
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
  due_date?: string | Date; // Added this field for compatibility
}

export interface ContractPayment {
  id: string;
  payment_date: string | Date;
  amount: number;
  status: string;
  payment_number: string;
  due_date: string | Date;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface CarInstallmentPayment {
  id: string;
  payment_date: string | Date;
  amount: number;
  status: string;
  payment_number: string;
  due_date: string | Date;
  payment_method?: string;
  reference?: string;
  notes?: string;
}
