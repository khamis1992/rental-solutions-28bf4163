
/**
 * Core types for the Payment Processing System
 * @module PaymentTypes
 */

import { DbId } from './database-common';

/**
 * Payment status tracking the lifecycle of a payment
 * - pending: Payment is scheduled but not processed
 * - processing: Payment is being processed
 * - completed: Payment successfully processed
 * - failed: Payment processing failed
 * - refunded: Payment was refunded
 * - cancelled: Payment was cancelled before processing
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

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
  payment_date?: string | null;
  /** Original due date */
  due_date?: string;
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
}

/**
 * Payment processing configuration and rules
 */
export interface PaymentConfig {
  /** Grace period in days before late fees apply */
  gracePeriod: number;
  /** Daily late fee amount */
  dailyLateFee: number;
  /** Maximum late fee cap */
  maxLateFee: number;
  /** Minimum partial payment percentage allowed */
  minPartialPayment: number;
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
 * Payment schedule for recurring payments
 */
export interface PaymentSchedule {
  id: string;
  lease_id: string;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  amount: number;
  next_date: string;
  end_date?: string;
}
