// Add this function at the top of the file
/**
 * Checks if a value exists (is not null or undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Checks if a value exists (is not null or undefined)
 */
export function valueExists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is a valid number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a valid string
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Safely converts a value to a string
 * Returns an empty string if the value is null or undefined
 */
export function asString(value: any): string {
  return value?.toString() || '';
}

/**
 * Safely converts a value to a number
 * Returns 0 if the value is null, undefined, or not a number
 */
export function asNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Safely converts a value to a boolean
 * Returns false if the value is null or undefined
 */
export function asBoolean(value: any): boolean {
  return !!value;
}

/**
 * Safely converts a value to a Date object
 * Returns null if the value is null, undefined, or not a valid date
 */
export function asDate(value: any): Date | null {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error("Error converting to Date:", error);
    return null;
  }
}

/**
 * Safely converts a value to a database ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asDatabaseType<T extends string>(value: any): T | null {
  if (!value) {
    return null;
  }
  return String(value) as T;
}

/**
 * Safely converts a value to a traffic fine ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asTrafficFineId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely converts a value to a lease ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asLeaseId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely converts a value to a customer ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asCustomerId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely converts a value to a vehicle ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asVehicleId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely converts a value to a payment ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asPaymentId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely converts a value to a legal case ID (string)
 * Returns an empty string if the value is null or undefined
 */
export function asLegalCaseId(value: any): string {
  if (!value) {
    return '';
  }
  return String(value);
}

/**
 * Safely retrieves a property from an object
 * Returns undefined if the object or property is null or undefined
 */
export function safeProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  if (!obj) {
    return undefined;
  }
  return obj[key];
}

/**
 * Flattens an array of arrays into a single array
 */
export function flattenArray<T>(arr: T | T[]): T[] {
  if (!Array.isArray(arr)) {
    return [arr]; 
  }
  
  return arr.flat();
}

/**
 * Safely converts a value to a number
 * Returns null if the value is null, undefined, or not a number
 */
export function toNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}
