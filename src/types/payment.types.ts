
/**
 * Core types for the Payment Processing System
 * @module PaymentTypes
 */

import { DbId, PaymentStatus as DbPaymentStatus } from './database-common';

/**
 * Payment status enum
 */
export enum PaymentStatusEnum {
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
 * Payment status type
 * This must be compatible with database-common PaymentStatus type
 */
export type PaymentStatus = DbPaymentStatus;

/**
 * Core payment record structure
 */
export interface Payment {
  /** Unique payment identifier */
  id: DbId;
  /** Agreement/lease reference */
  lease_id?: DbId;
  /** Payment amount */
  amount: number;
  /** Amount actually paid */
  amount_paid?: number;
  /** Remaining balance */
  balance?: number;
  /** When payment was made */
  payment_date?: string | Date | null;
  /** Original due date */
  due_date?: string | Date;
  /** Days payment is overdue */
  days_overdue?: number;
  /** Late fee amount if applicable */
  late_fine_amount?: number;
  /** Payment method used */
  payment_method?: string;
  /** External transaction reference */
  transaction_id?: string;
  /** Payment purpose/description */
  description?: string;
  /** Current payment status */
  status?: PaymentStatus;
  /** Payment type (rent, deposit, fine, etc) */
  type?: string;
  /** Notes about the payment */
  notes?: string;
  /** Reference number for external systems */
  reference_number?: string;
}

/**
 * Input for recording a new payment
 */
export interface PaymentInput {
  lease_id: DbId;
  amount: number;
  payment_date?: Date;
  payment_method?: string;
  notes?: string;
  transaction_id?: string;
  reference_number?: string;
  include_late_fee?: boolean;
  is_partial_payment?: boolean;
}

/**
 * Payment processing result with status and details
 */
export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  error?: string;
  transaction_reference?: string;
}

/**
 * Payment handler options
 */
export interface PaymentHandlerOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
}

/**
 * Payment schedule for recurring payments
 */
export interface PaymentSchedule {
  id: string;
  lease_id: string;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  amount: number;
  next_date: string | Date;
  end_date?: string | Date;
}
