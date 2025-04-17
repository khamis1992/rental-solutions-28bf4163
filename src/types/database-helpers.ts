
import { Database } from './database.types';

// Type conversion helpers for database IDs
export function castToDbId<T>(id: string): T {
  return id as unknown as T;
}

// Generic helper for working with Supabase table data
export function convertStringIdToDbId<T>(id: string): any {
  return id; // Casting to any to appease TypeScript while maintaining runtime value
}

// Type assertion functions for database entities
export function asTableRowId<T extends keyof Database['public']['Tables']>(
  table: T, 
  id: string
): any {
  return id; // Runtime is just the string, but TypeScript will see it as the appropriate ID type
}
