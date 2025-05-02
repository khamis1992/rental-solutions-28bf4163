
/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract a value from an object that might be null or undefined
 */
export function safeExtract<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!obj) {
    return defaultValue;
  }
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Cast a string to a UUID, ensuring it has the correct format
 */
export function castToUUID(value: string): string {
  // Simple validation to ensure the string looks like a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value;
  }
  throw new Error(`Invalid UUID format: ${value}`);
}
