
/**
 * Lease status for the system - matches database enum exactly
 * These are the actual values accepted by the database
 */
export type LeaseStatus = 
  | 'active' 
  | 'closed' 
  | 'cancelled';

/**
 * Subset of lease status values used for validation
 * These are the accepted values in forms and validation schemas
 */
export type ValidationLeaseStatus = 
  | 'active' 
  | 'closed'
  | 'cancelled';

/**
 * Converts a LeaseStatus to a ValidationLeaseStatus
 * Maps any non-validation compatible status to 'active'
 */
export function toValidationLeaseStatus(status: LeaseStatus): ValidationLeaseStatus {
  // Check if status is already a valid ValidationLeaseStatus
  if ([
    'active', 
    'cancelled', 
    'closed'
  ].includes(status)) {
    return status as ValidationLeaseStatus;
  }
  
  // Default to active for any other status
  return 'active';
}

/**
 * Ensures that a status value is a valid LeaseStatus
 * Maps values to the correct database enum values
 */
export function ensureValidLeaseStatus(status: string | null | undefined): LeaseStatus {
  if (!status) return 'active'; // افتراضياً نشط بدلاً من مسودة
  
  // تطبيق mapping للقيم المختلفة
  const statusMap: { [key: string]: LeaseStatus } = {
    'draft': 'active',          // map draft to active
    'pending': 'active',        // map pending to active  
    'completed': 'closed',      // map completed to closed
    'terminated': 'cancelled',  // map terminated to cancelled
    'expired': 'closed',        // map expired to closed
    'active': 'active',
    'closed': 'closed', 
    'cancelled': 'cancelled'
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || 'active';
}

/**
 * Ensures a validation-compatible lease status, defaulting to 'active' if not
 */
export function ensureValidationLeaseStatus(status: string | null | undefined): ValidationLeaseStatus {
  if (!status) return 'active';
  return toValidationLeaseStatus(status as LeaseStatus);
}
