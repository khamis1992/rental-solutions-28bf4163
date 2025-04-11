
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

/**
 * Safely converts a database response to a typed object, handling error cases
 * 
 * @param response The Supabase response that might contain data or an error
 * @param mapper A function that maps database response to application model
 * @param logErrorMsg Optional error message to log if extraction fails
 */
export function convertDbResponse<T, R>(
  response: { data: T | null, error: any } | undefined | null,
  mapper: (data: T) => R,
  logErrorMsg?: string
): R | null {
  if (!response) {
    console.warn(logErrorMsg || 'Empty response from database');
    return null;
  }
  
  if (response.error) {
    console.error(logErrorMsg || 'Database error:', response.error);
    return null;
  }
  
  if (!response.data) {
    console.warn(logErrorMsg || 'No data in response');
    return null;
  }
  
  try {
    return mapper(response.data);
  } catch (err) {
    console.error(logErrorMsg || 'Error mapping database response:', err);
    return null;
  }
}

/**
 * Type guard to check if response is a database error
 */
export function isDbError(response: any): response is { error: any } {
  return response && typeof response === 'object' && 'error' in response && response.error !== null;
}

/**
 * Safely extract property from potentially error-containing response
 */
export function safeExtractProperty<T, K extends keyof T>(
  response: { data: T | null, error: any } | undefined | null,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!response || response.error || !response.data) {
    return defaultValue;
  }
  
  return response.data[key];
}

/**
 * Convert nullable values to their non-null type without triggering TS errors
 */
export function nonNullable<T>(value: T): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`Expected non-nullable value but got ${value}`);
  }
  return value as NonNullable<T>;
}

/**
 * Safe transformation function that handles nullability and errors
 */
export function safeTransform<T, R>(
  value: T | null | undefined,
  transformFn: (val: T) => R,
  defaultValue: R
): R {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  try {
    return transformFn(value);
  } catch (err) {
    console.error('Error transforming value:', err);
    return defaultValue;
  }
}
