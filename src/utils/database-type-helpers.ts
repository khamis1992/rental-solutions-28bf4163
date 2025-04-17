
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
