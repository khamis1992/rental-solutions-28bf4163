
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';
import { useErrorStore } from '@/store/useErrorStore';

/**
 * Type guard to check if a value is not null or undefined
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if Supabase response has data
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && exists(response.data));
}

/**
 * Maps Supabase payment records to ExtendedPayment interface
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
 */
export function mapToExtendedPayments(
  data: Record<string, any>[] | null | undefined
): ExtendedPayment[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => mapToExtendedPayment(item)).filter(exists);
}

/**
 * Safely process a Supabase response with error logging
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
 * Helper to log response errors to the error store
 */
function logResponseError(
  message: string, 
  error?: any,
  context?: Record<string, any>
): void {
  console.error(`[Database Error] ${message}`, error, context);
  
  // Log to the central error store if it exists
  if (useErrorStore && useErrorStore.getState) {
    try {
      useErrorStore.getState().addError({
        message: `${message}: ${error?.message || 'Unknown error'}`,
        stack: error?.stack,
        context,
        severity: 'error',
        handled: false,
      });
    } catch (storeError) {
      console.error('Error using error store:', storeError);
    }
  }
}
