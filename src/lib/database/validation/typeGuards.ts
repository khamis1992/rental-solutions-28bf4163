import { Database } from '@/types/database.types';

/**
 * Type guards for validating data structures
 */

/**
 * Checks if the provided value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Checks if the value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if the value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if the value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown, 
  prop: K
): value is { [key in K]: unknown } {
  return isObject(value) && prop in value;
}

/**
 * Checks if the value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if the value has map function (like arrays)
 */
export function hasMapFunction<T>(value: unknown): value is { map: (fn: (item: T) => unknown) => unknown[] } {
  return hasProperty(value, 'map') && typeof value.map === 'function';
}

/**
 * Checks if the value has filter function (like arrays)
 */
export function hasFilterFunction<T>(value: unknown): value is { filter: (fn: (item: T) => boolean) => T[] } {
  return hasProperty(value, 'filter') && typeof value.filter === 'function';
}

/**
 * Checks if the value has find function (like arrays)
 */
export function hasFindFunction<T>(value: unknown): value is { find: (fn: (item: T) => boolean) => T | undefined } {
  return hasProperty(value, 'find') && typeof value.find === 'function';
}

/**
 * Check if the value is a specific database entity
 */
export function isEntity<T extends Record<string, unknown>>(
  value: unknown, 
  requiredProps: Array<keyof T>
): value is T {
  if (!isObject(value)) return false;
  
  return requiredProps.every(prop => prop in value);
}

/**
 * Check if the value is a valid database table row
 */
export function isTableRow<T extends keyof Database['public']['Tables']>(
  tableName: T,
  value: unknown
): value is Database['public']['Tables'][T]['Row'] {
  if (!isObject(value)) return false;
  
  const row = value as Record<string, unknown>;
  return 'id' in row && typeof row.id === 'string';
}

/**
 * Check if the value is a valid database enum value
 */
export function isValidEnum<T extends keyof Database['public']['Enums']>(
  enumName: T,
  value: unknown,
  validValues: readonly string[]
): value is Database['public']['Enums'][T] {
  if (!isString(value)) return false;
  return validValues.includes(value);
}

/**
 * Check if the value is a valid database composite type
 */
export function isValidCompositeType<T extends keyof Database['public']['CompositeTypes']>(
  typeName: T,
  value: unknown,
  requiredProps: string[]
): value is Database['public']['CompositeTypes'][T] {
  if (!isObject(value)) return false;
  return requiredProps.every(prop => prop in value);
}
