
/**
 * Safely maps over response data with error handling
 */
export function safeDataMap<T, R>(
  data: T[] | null | undefined,
  mapFn: (item: T) => R
): R[] {
  if (!data || !Array.isArray(data)) {
    console.warn('No data to map or data is not an array');
    return [];
  }

  return data.map((item) => {
    try {
      return mapFn(item);
    } catch (error) {
      console.error('Error mapping item:', error);
      throw error;
    }
  });
}

/**
 * Type guard for checking if a value exists
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if a value has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}
