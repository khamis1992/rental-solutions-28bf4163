
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
}

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
}
