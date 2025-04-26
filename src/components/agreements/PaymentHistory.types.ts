
import { UUID } from '@/lib/uuid-helpers';

export interface Payment {
  id: string;
  lease_id?: string;
  amount?: number;
  amount_paid?: number;
  balance?: number;
  payment_date: string | Date;
  payment_method?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed' | 'partially_paid' | 'overdue';
  type?: 'Income' | 'Expense' | 'RENT' | 'DEPOSIT' | 'LATE_PAYMENT_FEE' | 'OTHER';
  description?: string;
  reference_number?: string;
  notes?: string;
  days_overdue?: number;
  original_due_date?: string | Date;
  late_fine_amount?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  processed?: boolean;
}

export interface ExtendedPayment extends Payment {
  lease?: {
    agreement_number?: string;
    customer_id?: string;
  };
  customer?: {
    full_name?: string;
    email?: string;
  };
}

export interface PaymentUpdateParams {
  id: string;
  data: Partial<Payment>;
}

export interface PaymentDeleteParams {
  id: string;
}

export interface PaymentHistoryProps {
  agreementId?: string;
}
