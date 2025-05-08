
/**
 * Utility functions for working with UUIDs
 */

// UUID type
export type UUID = string;

/**
 * Cast a string to UUID type
 * Note: This doesn't perform runtime validation, just helps with TypeScript type safety
 */
export function asUUID(id: string): UUID {
  return id as UUID;
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Check if UUID is zero/null UUID
 */
export function isNullUUID(id: string | null | undefined): boolean {
  if (!id) return true;
  return id === '00000000-0000-0000-0000-000000000000';
}
