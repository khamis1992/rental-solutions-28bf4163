
import { Database } from './database.types';
import { DbId } from '@/types/database-common';

export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];

/**
 * Unified payment status types for the entire application
 */
export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'voided';

/**
 * Unified payment type for the entire application
 */
export interface Payment {
  id: DbId;
  amount: number;
  amount_paid?: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus | string; // Allow string for backward compatibility
  lease_id?: DbId;
  type?: string;
  description?: string;
  payment_method?: string;
  transaction_id?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  balance?: number;
  next_payment_date?: string | null;
  reference_number?: string;
  notes?: string;
  original_due_date?: string | null;
}

/**
 * Payment metrics for analytics
 */
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

/**
 * Options for special payment operations
 */
export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}

// Re-export types for backward compatibility
export type { Payment as PaymentHistoryItem } from '@/types/payment-history.types';
