
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { DbListResponse, DbSingleResponse } from '../database/types';

/**
 * Type guard to check if a response has data and no error
 */
export function isSuccessResponse<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T> | DbListResponse<T> | DbSingleResponse<T>
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Type guard to check if an object is a specific database table row
 */
export function isTableRow<T extends object>(
  obj: any, 
  requiredProps: (keyof T)[] = ['id']
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  
  for (const prop of requiredProps) {
    if (!(prop in obj)) return false;
  }
  
  return true;
}
