
/**
 * Type guard utilities for database validation
 */

/**
 * Checks if a value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

/**
 * Checks if a value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Checks if a value is a valid UUID
 */
export function isUuid(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Checks if a value is a valid date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a value is a valid email
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim() !== '';
}

/**
 * Checks if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Checks if a value is a non-negative number (zero or positive)
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}
