
import { Database } from '@/types/database.types';

/**
 * Payment interface definition with required fields exposed
 */
export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null; 
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
}

// Database-specific payment type
export type DbPayment = Database['public']['Tables']['unified_payments']['Row'];

/**
 * Extended payment interface with additional fields
 */
export interface ExtendedPayment extends Payment {
  id: string;
  lease_id?: string;
  amount: number;
  amount_paid?: number;
  balance?: number;
  payment_date: string | null;
  due_date?: string | null;
  status?: string;
  payment_method?: string | null;
  description?: string | null;
  type?: string;
  days_overdue?: number;
}

/**
 * Type guards
 */
export function isPayment(obj: any): obj is Payment {
  return obj && typeof obj === 'object' && 'id' in obj && 'amount' in obj;
}

/**
 * Database ID type helper functions
 */
export function asPaymentId(id: string): DbPayment['id'] {
  return id as DbPayment['id'];
}

export function asLeaseId(id: string): DbPayment['lease_id'] {
  return id as DbPayment['lease_id'];
}

export function asPaymentStatus(status: string): DbPayment['status'] {
  return status as DbPayment['status'];
}

/**
 * Response type guard
 */
export function isPaymentResponse(response: any): response is { data: Payment } {
  return response && !response.error && response.data && isPayment(response.data);
}
