import { createValidationError } from '@/types/error.types';
import { isNotNull } from '@/lib/utils/null-safety';

/**
 * Database validation utilities for ensuring data integrity
 */

/**
 * Validates that the provided value is not null or undefined
 * @param value - The value to check
 * @param name - Name of the parameter for error message
 * @returns The original value if valid
 * @throws ValidationError if the value is null or undefined
 */
export function required<T>(value: T | null | undefined, name: string): T {
  if (!isNotNull(value)) {
    throw createValidationError(
      `Required parameter ${name} is missing`,
      { field: name, message: `Required parameter ${name} is missing` }
    );
  }
  return value;
}

/**
 * Validates that a string is not empty
 * @param value - The string to check
 * @param name - Name of the parameter for error message
 * @returns The original string if valid
 * @throws ValidationError if the string is empty
 */
export function nonEmptyString(value: string | null | undefined, name: string): string {
  const validated = required(value, name);
  if (validated.trim().length === 0) {
    throw createValidationError(
      `${name} cannot be empty`,
      { field: name, message: `${name} cannot be empty` }
    );
  }
  return validated;
}

/**
 * Validates that a number is within a range
 * @param value - The number to check
 * @param name - Name of the parameter for error message
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The original number if valid
 * @throws ValidationError if the number is outside the range
 */
export function inRange(value: number | null | undefined, name: string, min: number, max: number): number {
  const validated = required(value, name);
  if (validated < min || validated > max) {
    throw createValidationError(
      `${name} must be between ${min} and ${max}`,
      { field: name, message: `${name} must be between ${min} and ${max}` }
    );
  }
  return validated;
}

/**
 * Validates that a value is one of the allowed values
 * @param value - The value to check
 * @param name - Name of the parameter for error message
 * @param allowedValues - Array of allowed values
 * @returns The original value if valid
 * @throws ValidationError if the value is not in the allowed values
 */
export function oneOf<T>(value: T | null | undefined, name: string, allowedValues: T[]): T {
  const validated = required(value, name);
  if (!allowedValues.includes(validated)) {
    throw createValidationError(
      `${name} must be one of: ${allowedValues.join(', ')}`,
      { field: name, message: `${name} must be one of: ${allowedValues.join(', ')}` }
    );
  }
  return validated;
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

/**
 * Validates if the provided string is a valid database ID (UUID) and throws an error if not
 * @param id - The ID to check
 * @param name - Name for the error message
 * @returns The original ID if valid
 * @throws Error if the ID is not valid
 */
export function validateDatabaseId(id: string, name: string = 'ID'): string {
  if (!isValidDatabaseId(id)) {
    throw new Error(`Invalid ${name} format: ${id}`);
  }
  return id;
}

