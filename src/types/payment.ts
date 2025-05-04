
import { DbId } from './database-common';

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
}

/**
 * Core payment record structure
 */
export interface Payment {
  id: DbId;
  lease_id?: DbId;
  amount: number;
  payment_date: string;
  days_overdue?: number;
  late_fine_amount?: number;
  payment_method?: string;
  transaction_id?: string | null;
  description?: string;
  status: PaymentStatus;
  type?: string;
  notes?: string;
  reference_number?: string | null;
}

export interface PaymentInput {
  lease_id: DbId;
  amount: number;
  payment_date?: Date | string;
  payment_method?: string;
  notes?: string;
  transaction_id?: string;
  reference_number?: string;
  include_late_fee?: boolean;
  is_partial_payment?: boolean;
}
