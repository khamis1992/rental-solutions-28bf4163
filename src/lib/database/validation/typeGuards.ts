
/**
 * Type guards for validating data structures
 */

/**
 * Checks if the provided value is an array
 */
export function isArray<T = any>(value: unknown): value is T[] {
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
 * Checks if the value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown, 
  prop: K
): value is { [key in K]: unknown } {
  return isObject(value) && prop in value;
}

/**
 * Checks if the value has a length property (like arrays or strings)
 */
export function hasLength(value: unknown): value is { length: number } {
  return hasProperty(value, 'length') && typeof value.length === 'number';
}

/**
 * Checks if the value has map function (like arrays)
 */
export function hasMapFunction<T = any>(value: unknown): value is { map: (fn: (item: T) => any) => any[] } {
  return hasProperty(value, 'map') && typeof value.map === 'function';
}

/**
 * Checks if the value has filter function (like arrays)
 */
export function hasFilterFunction<T = any>(value: unknown): value is { filter: (fn: (item: T) => boolean) => T[] } {
  return hasProperty(value, 'filter') && typeof value.filter === 'function';
}

/**
 * Checks if the value has find function (like arrays)
 */
export function hasFindFunction<T = any>(value: unknown): value is { find: (fn: (item: T) => boolean) => T | undefined } {
  return hasProperty(value, 'find') && typeof value.find === 'function';
}

/**
 * Check if the value is a specific database entity
 */
export function isEntity<T extends Record<string, any>>(
  value: unknown, 
  requiredProps: Array<keyof T>
): value is T {
  if (!isObject(value)) return false;
  
  return requiredProps.every(prop => prop in value);
}

/**
 * Type guard for success responses
 */
export function isSuccessResponse<T>(response: any): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}
