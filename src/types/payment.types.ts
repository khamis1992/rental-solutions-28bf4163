
// Define proper PaymentStatus type that matches database values
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_paid';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | Date;
  due_date?: string | Date;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  lease_id?: string;
  status: PaymentStatus;
  type?: string;
  late_fine_amount?: number;
  created_at?: string;
  updated_at?: string;
  // Add missing properties
  notes?: string;
  transaction_id?: string;
  amount_paid?: number;
  balance?: number;
  days_overdue?: number;
  original_due_date?: string | null;
  include_late_fee?: boolean;
  is_partial?: boolean;
}

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}
