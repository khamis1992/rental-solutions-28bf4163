
/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract data from a response object that might have errors
 */
export function safeExtract<T>(response: { data?: T, error?: any }): T | null {
  if (response.error || !response.data) {
    return null;
  }
  return response.data;
}

/**
 * Helper function to add a castToUUID function for handling UUIDs safely
 */
export function castToUUID(id: string): string {
  return id;
}
