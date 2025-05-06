
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
 * Validates and normalizes profile status for database operations
 * @param status - Status string to validate
 * @returns Validated profile status string
 */
export function asProfileStatus(status: string): string {
  // Convert application status strings to database status strings
  switch (status.toLowerCase()) {
    case 'active':
    case 'inactive':
    case 'pending':
    case 'suspended':
    case 'blocked':
    case 'pending_review':
      return status.toLowerCase();
    default:
      console.warn(`Unknown profile status '${status}', defaulting to 'active'`);
      return 'active';
  }
}

/**
 * Validates and normalizes lease status for database operations
 * @param status - Status string to validate
 * @returns Validated lease status string
 */
export function asLeaseStatus(status: string): string {
  // Convert application status strings to database status strings
  switch (status.toLowerCase()) {
    case 'active':
    case 'pending':
    case 'cancelled':
    case 'completed':
    case 'pending_payment':
    case 'closed':
    case 'draft':
    case 'pending_deposit':
    case 'terminated':
    case 'archived':
      return status.toLowerCase();
    default:
      console.warn(`Unknown lease status '${status}', defaulting to 'pending'`);
      return 'pending';
  }
}

/**
 * Validates and normalizes payment status for database operations
 * @param status - Status string to validate
 * @returns Validated payment status string
 */
export function asPaymentStatus(status: string): string {
  // Convert application status strings to database status strings
  switch (status.toLowerCase()) {
    case 'pending':
    case 'paid':
    case 'late':
    case 'overdue':
    case 'refunded':
    case 'partial':
    case 'cancelled':
    case 'scheduled':
      return status.toLowerCase();
    default:
      console.warn(`Unknown payment status '${status}', defaulting to 'pending'`);
      return 'pending';
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
