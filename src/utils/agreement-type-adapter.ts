
import { Agreement as ValidationAgreement } from '@/lib/validation-schemas/agreement';
import { Agreement as DataAgreement } from '@/types/agreement';
import { LeaseStatus, ValidationLeaseStatus } from '@/types/lease-types';

/**
 * Adapts an Agreement object from the database/API model to the validation model
 */
export function adaptToValidationAgreement(agreement: DataAgreement): ValidationAgreement {
  // Map LeaseStatus to the specific string literals expected by ValidationAgreement
  const mapStatus = (status: string): ValidationLeaseStatus => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'cancelled':
        return 'cancelled';
      case 'draft':
        return 'draft';
      case 'closed':
        return 'closed';
      case 'completed': // Special case mapping "completed" to "closed"
        return 'closed';
      case 'expired':
        return 'expired';
      default:
        return 'draft'; // Default fallback
    }
  };

  return {
    ...agreement,
    status: mapStatus(agreement.status)
  } as ValidationAgreement;
}

/**
 * Adapts a ValidationAgreement back to the database/API model
 */
export function adaptToDataAgreement(agreement: ValidationAgreement): DataAgreement {
  return agreement as unknown as DataAgreement;
}
