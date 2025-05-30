/**
 * Type definition for JSON values
 * This type represents all possible JSON values that can be stored in the database
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Type guard to check if a value is a valid JSON value
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid JSON value
 */
export function isValidJson(value: unknown): value is Json {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isValidJson);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isValidJson);
  }
  return false;
}

/**
 * Type guard to check if a value is a valid JSON object
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid JSON object
 */
export function isValidJsonObject(value: unknown): value is { [key: string]: Json } {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isValidJson);
}

/**
 * Type guard to check if a value is a valid JSON array
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid JSON array
 */
export function isValidJsonArray(value: unknown): value is Json[] {
  return Array.isArray(value) && value.every(isValidJson);
} 