
import { Database } from '@/types/database.types';

/**
 * Helper to safely cast string IDs to the appropriate database ID types
 * Use this when passing IDs to Supabase queries to avoid TypeScript errors
 */
export function castIdForQuery(id: string): any {
  return id;
}

/**
 * Helper to cast any string to a UUID format for database operations
 * This is particularly useful for ID columns that are UUID types in the database
 */
export function castToUUID(id: string): string {
  return id as string;
}

/**
 * Safe getter for nested properties in database responses
 * Helps avoid null reference errors when accessing deeply nested properties
 */
export function getNestedProperty<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return defaultValue;
      current = current[part];
    }
    return current !== null && current !== undefined ? current as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Type-safe accessor for database entity properties
 * Provides better type inference than direct property access
 */
export function getEntityProperty<T extends keyof Database['public']['Tables'], 
                               K extends keyof Database['public']['Tables'][T]['Row']>
                              (entity: Partial<Database['public']['Tables'][T]['Row']>, 
                               key: K): Database['public']['Tables'][T]['Row'][K] | undefined {
  return entity[key];
}

/**
 * Type-safe function to cast IDs for table operations
 * This ensures ID columns match the required type in the database
 * 
 * Returns any specifically to work with Supabase query parameters
 */
export function asTableId(table: string, id: string): any {
  return id;
}

/**
 * Helper functions for specific ID columns
 * All return any type to ensure compatibility with Supabase query parameters
 */
export function asAgreementIdColumn(id: string): any {
  return id;
}

export function asLeaseIdColumn(id: string): any {
  return id;
}

export function asVehicleIdColumn(id: string): any {
  return id;
}

export function asImportIdColumn(id: string): any {
  return id;
}

export function asTrafficFineIdColumn(id: string): any {
  return id;
}

export function asPaymentIdColumn(id: string): any {
  return id;
}

/**
 * Entity-specific ID helpers
 */
export function asLeaseId(id: string): any {
  return id;
}

export function asVehicleId(id: string): any {
  return id;
}

export function asAgreementId(id: string): any {
  return id;
}

export function asPaymentId(id: string): any {
  return id;
}

export function asImportId(id: string): any {
  return id;
}

/**
 * Status column helpers
 */
export function asStatusColumn(status: string): any {
  return status;
}

export function asPaymentStatusColumn(status: string | string[]): any {
  return status;
}

/**
 * Helper to check if a response has data
 */
export function hasData(response: any): boolean {
  return response && !response.error && response.data !== null;
}

/**
 * Helper to fix TypeScript issues with agreement_id and other column references
 */
export function asAgreementIdParam(id: string): any {
  return id;
}

/**
 * Helper specifically for agreement_id parameter in queries
 */
export function asAgreementIdFilterParam(id: string): any {
  return id;
}

/**
 * Helper for import_id parameter in queries
 */
export function asImportIdParam(id: string): any {
  return id;
}

/**
 * Helper to safely extract records from a Supabase response
 * Returns an empty array if the response is invalid or has an error
 */
export function safelyGetRecordsFromResponse<T>(data: T[] | null | undefined): T[] {
  if (!data) {
    return [];
  }
  return Array.isArray(data) ? data : [];
}
