
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Tables, Schema } from './database-types';
import { 
  hasData, 
  hasProperty, 
  safelyExtractData,
} from '@/utils/database-type-helpers';

// Re-export helper functions for compatibility
export { hasData, hasProperty, safelyExtractData };

// Helper function to safely extract data from a Supabase response
export function handleDatabaseResponse<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): T | null {
  if (response.error) {
    console.error('Database error:', response.error);
    return null;
  }
  
  // Handle both single and array responses
  if (Array.isArray(response.data)) {
    return response.data as unknown as T;
  }
  
  return response.data;
}
