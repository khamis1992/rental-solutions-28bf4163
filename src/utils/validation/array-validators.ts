
/**
 * Array validation utilities
 */

/**
 * Validates if an array is not empty
 */
export function isNonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validates array length within a range
 */
export function isArrayLengthValid(arr: unknown[], min: number, max?: number): boolean {
  if (!Array.isArray(arr)) return false;
  if (arr.length < min) return false;
  if (max !== undefined && arr.length > max) return false;
  return true;
}

/**
 * Validates if all items in array pass a test
 */
export function areAllItemsValid<T>(arr: T[], validator: (item: T) => boolean): boolean {
  return Array.isArray(arr) && arr.every(validator);
}

/**
 * Validates if at least one item in array passes a test
 */
export function hasSomeValidItems<T>(arr: T[], validator: (item: T) => boolean): boolean {
  return Array.isArray(arr) && arr.some(validator);
}

/**
 * Validates unique values in array
 */
export function hasUniqueValues<T>(arr: T[]): boolean {
  if (!Array.isArray(arr)) return false;
  const uniqueSet = new Set(arr);
  return uniqueSet.size === arr.length;
}

/**
 * Validates if array contains only specific types
 */
export function isTypedArray(arr: unknown[], type: string): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.every(item => typeof item === type);
}

/**
 * Simple postal code validation
 */
export function isValidPostalCode(code: string): boolean {
  // Basic postal code pattern - adjust regex as needed for your region
  const postalCodePattern = /^[A-Za-z0-9\s-]{3,10}$/;
  return postalCodePattern.test(code.trim());
}
