
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';

/**
 * Type guard to check if a value is not null or undefined
 * @param value Any value to check
 * @returns Type guard for non-null values
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if Supabase response has data
 * @param response Supabase response
 * @returns Type guard for valid response with data
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && exists(response.data));
}

/**
 * Maps Supabase payment records to ExtendedPayment interface
 * @param data Raw payment data
 * @returns Typed ExtendedPayment or null
 */
export function mapToExtendedPayment(
  data: Record<string, any> | null | undefined
): ExtendedPayment | null {
  if (!data) return null;
  
  return {
    id: data.id || '',
    lease_id: data.lease_id || '',
    amount: Number(data.amount) || 0,
    amount_paid: Number(data.amount_paid) || 0,
    balance: Number(data.balance) || 0,
    payment_date: data.payment_date || '',
    payment_method: data.payment_method || null,
    reference_number: data.reference_number || '',
    notes: data.notes || '',
    description: data.description || null,
    status: data.status || 'pending',
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    original_due_date: data.original_due_date || null,
    due_date: data.due_date || null,
    is_recurring: Boolean(data.is_recurring),
    type: data.type || '',
    days_overdue: Number(data.days_overdue) || 0,
    late_fine_amount: Number(data.late_fine_amount) || 0,
    processing_fee: Number(data.processing_fee) || 0,
    processed_by: data.processed_by || ''
  };
}

/**
 * Maps an array of Supabase payment records to ExtendedPayment[] array
 * @param data Array of payment data
 * @returns Array of typed ExtendedPayment objects
 */
export function mapToExtendedPayments(
  data: Record<string, any>[] | null | undefined
): ExtendedPayment[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => mapToExtendedPayment(item)).filter(exists);
}

/**
 * Safely process a Supabase response with error logging
 * @param response Supabase response
 * @param mapper Function to map data to desired type
 * @param context Optional context for error logging
 * @returns Mapped data or null on error
 */
export function processResponse<T, R>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  mapper: (data: T) => R | null,
  context?: Record<string, any>
): R | null {
  if (!response) {
    logResponseError('Empty response received', undefined, context);
    return null;
  }
  
  if (response.error) {
    logResponseError('Supabase query error', response.error, context);
    return null;
  }
  
  if (!response.data) {
    logResponseError('No data in response', undefined, context);
    return null;
  }
  
  try {
    return mapper(response.data);
  } catch (error) {
    logResponseError('Error mapping response data', error, context);
    return null;
  }
}

/**
 * Helper to log response errors to console
 * @param message Error message
 * @param error Error object
 * @param context Additional context
 */
function logResponseError(
  message: string, 
  error?: any,
  context?: Record<string, any>
): void {
  console.error(`[Database Error] ${message}`, error, context);
}
