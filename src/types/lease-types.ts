
/**
 * Comprehensive lease status definitions for use across the application
 */
export type LeaseStatus = 
  | 'active'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'pending_payment'
  | 'pending_deposit'
  | 'draft'
  | 'terminated'
  | 'archived'
  | 'closed'
  | 'expired';

// Make sure our lease status types always include all validation schema status types
export type ValidationLeaseStatus = 
  | 'active'
  | 'pending'
  | 'cancelled'
  | 'draft'
  | 'closed'
  | 'expired';

// Helper to check if a lease status is valid for the validation schema
export function isValidationLeaseStatus(status: LeaseStatus): status is ValidationLeaseStatus {
  return [
    'active',
    'pending',
    'cancelled',
    'draft', 
    'closed',
    'expired'
  ].includes(status);
}

// Convert a lease status to a validation-compatible status
export function toValidationLeaseStatus(status: LeaseStatus): ValidationLeaseStatus {
  if (isValidationLeaseStatus(status)) {
    return status;
  }
  
  // Map non-validation statuses to appropriate validation statuses
  switch(status) {
    case 'completed':
      return 'closed';
    case 'pending_payment':
    case 'pending_deposit':
      return 'pending';
    case 'terminated':
    case 'archived':
      return 'closed';
    default:
      return 'draft';
  }
}

/**
 * Ensures a lease status is valid, defaulting to 'draft' if not
 */
export function ensureValidLeaseStatus(status: any): LeaseStatus {
  if (!status) return 'draft';
  
  const validStatuses: LeaseStatus[] = [
    'active',
    'pending',
    'completed',
    'cancelled',
    'pending_payment',
    'pending_deposit',
    'draft',
    'terminated',
    'archived',
    'closed',
    'expired'
  ];
  
  return validStatuses.includes(status as LeaseStatus) 
    ? (status as LeaseStatus) 
    : 'draft';
}
