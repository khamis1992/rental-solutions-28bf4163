
/**
 * Standard response type for database operations
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
  message?: string;
  statusCode?: number;
}

/**
 * Create a successful response object
 */
export function successResponse<T>(data: T, message?: string): ServiceResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode: 200
  };
}

/**
 * Create an error response object
 */
export function errorResponse(error: Error | string, statusCode = 500): ServiceResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return {
    success: false,
    error,
    message: errorMessage,
    statusCode
  };
}

/**
 * Wrap any database or API operation with standardized error handling
 */
export async function wrapOperation<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<ServiceResponse<T>> {
  try {
    const result = await operation();
    return successResponse(result);
  } catch (error) {
    console.error(`${errorContext || 'Operation'} error:`, error);
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safe cast of database IDs (for type compatibility)
 */
export function safeIdCast<T extends string>(id: string): T {
  return id as T;
}

/**
 * Type guard to check if an object has a property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Safely access a property from an object
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj == null) return undefined;
  return obj[key];
}

/**
 * Enhanced type guard for checking if a database response has data
 * Now handles various response formats for better type safety
 */
export function hasResponseData<T>(response: any): response is { data: T; error: null } {
  // Handle PostgreSQL response format
  if (response && typeof response === 'object') {
    // Check for basic structure
    const hasDataField = 'data' in response && response.data !== null && response.data !== undefined;
    const noError = !response.error;
    
    return hasDataField && noError;
  }
  return false;
}

/**
 * Safe accessor for PostgreSQL response data
 */
export function getResponseData<T>(response: any): T | null {
  if (hasResponseData<T>(response)) {
    return response.data;
  }
  return null;
}
