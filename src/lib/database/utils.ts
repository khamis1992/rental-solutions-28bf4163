
/**
 * Utility functions for database operations
 */

/**
 * Validates and normalizes vehicle status for database operations
 * @param status - Status string to validate
 * @returns Validated vehicle status string
 */
export function asVehicleStatus(status: string): string {
  // Convert application status strings to database status strings
  switch (status.toLowerCase()) {
    case 'available':
    case 'rented':
    case 'maintenance':
    case 'sold':
    case 'damaged':
      return status.toLowerCase();
    case 'reserved': // Application may use 'reserved' but DB uses 'reserve'
      return 'reserve';
    default:
      console.warn(`Unknown vehicle status '${status}', defaulting to 'available'`);
      return 'available';
  }
}

/**
 * Validates and normalizes vehicle ID for database operations
 * @param id - ID string to validate
 * @returns Validated vehicle ID string
 */
export function asVehicleId(id: string): string {
  // Basic validation to ensure ID is not empty
  if (!id || id.trim() === '') {
    throw new Error('Invalid vehicle ID: empty ID provided');
  }
  return id.trim();
}

/**
 * Safely converts data to JSON string
 * @param data - Data to convert to JSON
 * @returns JSON string
 */
export function safeJsonify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error converting data to JSON:', error);
    return '{}';
  }
}

/**
 * Safely parses JSON string
 * @param json - JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}
