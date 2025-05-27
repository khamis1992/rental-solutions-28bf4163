
/**
 * UUID validation utilities
 */

export function isValidUUID(value: string | undefined | null): value is string {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Check for the literal string "undefined" or "null"
  if (value === 'undefined' || value === 'null') {
    return false;
  }
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function validateUUID(value: string | undefined | null, context?: string): string {
  if (!isValidUUID(value)) {
    const errorMsg = context 
      ? `Invalid UUID format in ${context}: ${value}`
      : `Invalid UUID format: ${value}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return value;
}

export function safeUUID(value: string | undefined | null, fallback?: string): string | null {
  if (isValidUUID(value)) {
    return value;
  }
  
  if (fallback && isValidUUID(fallback)) {
    return fallback;
  }
  
  return null;
}
