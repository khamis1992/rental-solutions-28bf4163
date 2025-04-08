
/**
 * Type conversion utilities to handle inconsistencies between frontend and backend types
 */

import { Json } from '@/integrations/supabase/types';

/**
 * Safely extract a property from JSON data that might be missing
 */
export function safeExtractProperty<T>(data: any, property: string, defaultValue: T): T {
  if (!data) return defaultValue;
  if (typeof data === 'object' && property in data) {
    return data[property] as T;
  }
  return defaultValue;
}

/**
 * Convert a JSON value to a specific type with fallback
 */
export function convertJsonToType<T>(json: Json | null, defaultValue: T): T {
  if (json === null) return defaultValue;
  return json as unknown as T;
}

/**
 * Helper to safely cast API responses to expected types
 */
export function safeApiResponse<T>(data: any, defaultValue: T): T {
  if (!data) return defaultValue;
  return data as T;
}
