
/**
 * Database validation utilities for ensuring data integrity
 */
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if a response has data and no error
 */
export function isSuccessResponse<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Validates that the provided value is not null or undefined
 * @param value - The value to check
 * @param name - Name of the parameter for error message
 * @returns The original value if valid
 * @throws Error if the value is null or undefined
 */
export function required<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Required parameter ${name} is missing`);
  }
  return value;
}

/**
 * Validates that the provided value is a string and not empty
 * @param value - The value to check
 * @param name - Name of the parameter for error message
 * @returns The trimmed string value
 * @throws Error if the value is not a valid string
 */
export function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Parameter ${name} must be a string`);
  }
  
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new Error(`Parameter ${name} cannot be empty`);
  }
  
  return trimmed;
}

/**
 * Validates that the provided value is a valid UUID
 * @param value - The value to check
 * @param name - Name of the parameter for error message
 * @returns The original value if valid
 * @throws Error if the value is not a valid UUID
 */
export function validateUUID(value: string, name: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Parameter ${name} is not a valid UUID`);
  }
  return value;
}

/**
 * Ensures array is defined, defaulting to empty array if not
 * @param arr - Array to check
 * @returns The provided array or an empty array
 */
export function ensureArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Converts value to boolean
 * @param value - Value to convert
 * @param defaultValue - Default value if undefined
 * @returns Boolean representation of value
 */
export function asBoolean(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowercase = value.toLowerCase();
    return lowercase === 'true' || lowercase === 'yes' || lowercase === '1';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
}

/**
 * Validates status value against allowed values
 * @param status - Status to validate
 * @param allowedValues - List of allowed values
 * @param defaultValue - Default value if invalid
 * @returns Valid status string
 */
export function validateStatus<T extends string>(
  status: unknown,
  allowedValues: T[],
  defaultValue: T
): T {
  if (typeof status !== 'string') {
    return defaultValue;
  }
  
  const normalized = status.toLowerCase() as T;
  if (allowedValues.includes(normalized)) {
    return normalized;
  }
  
  console.warn(`Invalid status '${status}', defaulting to '${defaultValue}'`);
  return defaultValue;
}

/**
 * Validates if the provided string is a valid database ID (UUID)
 * @param id - The ID to check
 * @returns True if the ID is valid, false otherwise
 */
export function isValidDatabaseId(id: string | null | undefined): boolean {
  if (!id) return false;
  
  // UUID pattern check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
