
/**
 * Check if a response has data
 */
export function hasData(response: any): boolean {
  return response && !response.error && response.data !== null;
}

/**
 * Check if an object exists and has a specific property
 */
export function hasProperty(obj: any, prop: string): boolean {
  return obj && typeof obj === 'object' && prop in obj;
}

/**
 * Check if a value exists (not null or undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract data from a response
 */
export function safelyExtractData<T>(response: any): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

/**
 * Safely handle array data
 */
export function safeArrayData<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}
