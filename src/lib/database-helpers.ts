
/**
 * Database helpers and utilities for Supabase
 */
import { asTableId, asUUID } from './uuid-helpers';
import { handleDatabaseResponse, hasData, safelyExtractData } from '@/utils/database-type-helpers';
import { Database } from '@/types/database.types';

// Re-export helpers
export {
  asTableId,
  asUUID,
  handleDatabaseResponse,
  hasData,
  safelyExtractData
};

// Create a common type for Database IDs
export type DatabaseId = string;

/**
 * Safe type checking function for database responses
 */
export function isSuccessfulResponse<T>(response: any): response is { data: T, error: null } {
  return !response.error && response.data !== null && response.data !== undefined;
}

/**
 * Helper for ensuring all row typings match database schema 
 */
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper for creating insert values
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper for creating update values
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Safely cast a database ID to the correct type
 */
export function castDbId<T extends string>(id: string): T {
  return id as T;
}
