

/**
 * Lease status for the system 
 * This represents all possible status values for a lease
 */
export type LeaseStatus = 
  | 'draft' 
  | 'active' 
  | 'pending' 
  | 'expired' 
  | 'cancelled' 
  | 'closed' 
  | 'completed';

/**
 * Subset of lease status values used for validation
 * These are the accepted values in forms and validation schemas
 */
export type ValidationLeaseStatus = 
  | 'draft' 
  | 'active' 
  | 'pending' 
  | 'expired' 
  | 'cancelled' 
  | 'closed';

/**
 * Converts a LeaseStatus to a ValidationLeaseStatus
 * Maps any non-validation compatible status to 'draft'
 */
export function toValidationLeaseStatus(status: LeaseStatus): ValidationLeaseStatus {
  // Check if status is already a valid ValidationLeaseStatus
  if ([
    'draft', 
    'active', 
    'pending', 
    'expired', 
    'cancelled', 
    'closed'
  ].includes(status)) {
    return status as ValidationLeaseStatus;
  }
  
  // Default to draft for any other status
  return 'draft';
}

/**
 * Ensures that a status value is a valid LeaseStatus
 * Provides a safe default of 'draft' for invalid values
 */
export function ensureValidLeaseStatus(status: string | null | undefined): LeaseStatus {
  if (!status) return 'draft';
  
  // Check if status is a valid LeaseStatus
  if ([
    'draft', 
    'active', 
    'pending', 
    'expired', 
    'cancelled', 
    'closed',
    'completed'
  ].includes(status)) {
    return status as LeaseStatus;
  }
  
  // Default to draft for any other status
  return 'draft';
}

