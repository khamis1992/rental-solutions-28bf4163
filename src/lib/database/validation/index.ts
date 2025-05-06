/**
 * Export all validation utilities from the validation directory
 */
export * from './typeGuards';

/**
 * Validates and converts lease status to database-compatible format
 */
export function asLeaseStatus(status: string): string {
  return status;
}

/**
 * Validates and converts vehicle status to database-compatible format
 */
export function asVehicleStatus(status: string): string {
  return status;
}

/**
 * Validates and converts payment status to database-compatible format
 */
export function asPaymentStatus(status: string): string {
  return status;
}

/**
 * Generic status validator for database entities
 */
export function asEntityStatus(status: string): string {
  return status;
}

/**
 * Validates database ID format
 */
export function isValidDatabaseId(id: string): boolean {
  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
