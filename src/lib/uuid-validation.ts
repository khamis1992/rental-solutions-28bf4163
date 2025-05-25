
/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string | undefined | null): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  // Check for common invalid values
  if (uuid === 'undefined' || uuid === 'null' || uuid.trim() === '') {
    return false;
  }
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid UUID and throws an error if not
 */
export function validateUUID(uuid: string | undefined | null, fieldName: string = 'UUID'): string {
  if (!isValidUUID(uuid)) {
    throw new Error(`Invalid ${fieldName}: ${uuid}`);
  }
  return uuid as string;
}

/**
 * Safely converts a value to a UUID, returning null if invalid
 */
export function safeUUID(uuid: unknown): string | null {
  if (typeof uuid === 'string' && isValidUUID(uuid)) {
    return uuid;
  }
  return null;
}
