
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if a value is a valid string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a valid boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a valid object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is PostgrestResponse<T> & { data: T } {
  return !response.error && response.data !== null;
}

/**
 * Check if status is valid
 */
export function isValidStatus<T extends { status: string }>(
  record: T, 
  validStatuses: string[]
): boolean {
  return validStatuses.includes(record.status);
}

/**
 * Ensure array, even if input is single value
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Format validation errors into user-friendly message
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
    .join('\n');
}

// Export validators for consistency with other code
export const validators = {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isDate,
  ensureArray,
  formatValidationErrors
};

// Export typeGuards for backwards compatibility
export const typeGuards = {
  isString,
  isNumber,
  isBoolean,
  isDate,
  isObject,
  isArray,
};
