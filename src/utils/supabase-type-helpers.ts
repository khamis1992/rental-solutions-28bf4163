
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
