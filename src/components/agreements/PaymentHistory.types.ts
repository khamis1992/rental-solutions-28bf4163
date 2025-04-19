
import { UUID } from '@/utils/database-type-helpers';

/**
 * Payment interface definition with required fields exposed
 */
export interface Payment {
  id: UUID;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null; 
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: UUID;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
}

// Database-specific payment type
export type DbPayment = any; // Replace with actual Database type when available

/**
 * Extended payment interface with additional fields
 */
export interface ExtendedPayment extends Payment {
  id: UUID;
  lease_id?: UUID;
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
 * Helper function to safely access Supabase response data with proper type checking
 */
export function getResponseData<T>(
  response: { data: T | null; error: any } | null | undefined
): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

/**
 * Type guard to check if a response contains data
 */
export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: T; error: null } {
  return !!response && !response.error && response.data !== null;
}
