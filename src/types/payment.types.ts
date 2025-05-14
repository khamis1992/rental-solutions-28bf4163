
export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'partially_paid' | 'voided';

export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  payment_date?: string;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  status: PaymentStatus;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  due_date?: string;
  original_due_date?: string;
  created_at?: string;
  updated_at?: string;
  amount_paid?: number;
  balance?: number;
  notes?: string;
  transaction_id?: string;
  next_payment_date?: string | null;
}

export type PaymentInsert = Omit<Payment, 'id'>;
export type PaymentUpdate = Partial<Payment>;
