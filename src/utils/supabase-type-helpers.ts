
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

export function getResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): T | null {
  if (!response || response.error || !response.data) {
    console.error('Error in Supabase response:', response?.error);
    return null;
  }
  return response.data;
}

export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null;
}

export function handleSupabaseResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): T | null {
  if (response.error) {
    console.error('Error in Supabase response:', response.error);
    return null;
  }
  return response.data || null;
}

// Safe type casting function for database IDs
export function castToUUID(id: string): string {
  return id;
}

// Handle casting for string-to-Date conversions safely
export function toDate(dateString: string | Date | null): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error('Error parsing date string:', e);
    return null;
  }
}

// Additional helper for payment record type conversion
export function toPaymentRecord<T extends Record<string, any>>(data: T[]): T[] {
  // This function converts database payment records to the expected format
  // In a real scenario, you would apply transformations here
  return data;
}
