/**
 * Type-safe utilities for handling null/undefined values
 */

/**
 * Type guard to check if a value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is null or undefined
 */
export function isNull<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safely get a value from an object, with type safety
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  return obj[key] ?? defaultValue;
}

/**
 * Safely get a nested value from an object, with type safety
 */
export function safeGetNested<T, K1 extends keyof T, K2 extends keyof NonNullable<T[K1]>>(
  obj: T | null | undefined,
  key1: K1,
  key2: K2,
  defaultValue?: NonNullable<T[K1]>[K2]
): NonNullable<T[K1]>[K2] | undefined {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  const value = obj[key1];
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return (value as NonNullable<T[K1]>)[key2] ?? defaultValue;
}

/**
 * Safely execute a function with null/undefined handling
 */
export function safeExecute<T, R>(
  value: T | null | undefined,
  fn: (value: T) => R,
  defaultValue?: R
): R | undefined {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  try {
    return fn(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely convert a value to a string
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Safely convert a value to a number
 */
export function safeToNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Safely convert a value to a boolean
 */
export function safeToBoolean(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return Boolean(value);
}

/**
 * Safely convert a value to a Date
 */
export function safeToDate(value: unknown): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  const date = new Date(String(value));
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Safely trim a string value with null/undefined handling
 */
export function safeTrim(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value !== 'string') {
    return String(value).trim();
  }
  return value.trim();
}

/**
 * Check if a string has meaningful content after trimming
 */
export function hasContent(value: string | null | undefined, minLength: number = 1): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const trimmed = safeTrim(value);
  return trimmed.length >= minLength;
}