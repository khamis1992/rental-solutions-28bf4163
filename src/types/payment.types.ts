
import { Database } from './database.types';
import { DbId } from '@/types/database-common';

export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  VOIDED = 'voided'
}

export interface Payment {
  id: DbId;
  amount: number;
  amount_paid?: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus;
  lease_id?: DbId;
  type?: string;
  description?: string;
  payment_method?: string;
  transaction_id?: string | null;
  late_fine_amount?: number;
  days_overdue?: number;
  balance?: number;
  next_payment_date?: string | null;
  reference_number?: string;
  notes?: string;
  original_due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMetrics {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lateFees: number;
  paidOnTime: number;
  paidLate: number;
  unpaid: number;
  totalPayments: number;
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

export type { Payment as PaymentHistoryItem } from './payment-history.types';
