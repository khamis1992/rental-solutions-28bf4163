
import { Agreement as ValidationAgreement } from '@/lib/validation-schemas/agreement';
import { Agreement } from '@/types/agreement';
import { LeaseStatus, ensureValidLeaseStatus, ensureValidationLeaseStatus } from '@/types/lease-types';

/**
 * Adapts the application Agreement type to the validation schema Agreement type
 * This is necessary because the validation schema has a more restrictive status type
 */
export function adaptAgreementToValidationSchema(agreement: Agreement): ValidationAgreement {
  // Convert the potentially broader LeaseStatus to the more restrictive ValidationLeaseStatus
  const adaptedStatus = ensureValidationLeaseStatus(agreement.status);
  
  // Format dates as strings if they're Date objects
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.toISOString();
    }
    return date;
  };
  
  return {
    ...agreement,
    status: adaptedStatus,
    start_date: formatDate(agreement.start_date) as string,
    end_date: formatDate(agreement.end_date) as string,
    created_at: formatDate(agreement.created_at),
    updated_at: formatDate(agreement.updated_at),
  } as ValidationAgreement;
}

/**
 * Adapts an Agreement from components to Agreement for service usage
 */
export function adaptComponentAgreement(agreement: any): Agreement {
  // Ensure dates are properly formatted
  const toDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return undefined;
    return dateValue instanceof Date ? dateValue : new Date(dateValue);
  };
  
  return {
    ...agreement,
    status: ensureValidLeaseStatus(agreement.status),
    start_date: toDate(agreement.start_date) as Date,
    end_date: toDate(agreement.end_date) as Date,
    created_at: toDate(agreement.created_at),
    updated_at: toDate(agreement.updated_at),
  } as Agreement;
}

/**
 * Adapts API response to Agreement type 
 */
export function adaptApiResponseToAgreement(data: any): Agreement {
  if (!data) return {} as Agreement;
  
  // Convert string dates to Date objects
  const toDate = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };
  
  return {
    ...data,
    status: ensureValidLeaseStatus(data.status),
    start_date: toDate(data.start_date) as Date,
    end_date: toDate(data.end_date) as Date,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  } as Agreement;
}

/**
 * Adapts an array of agreements from API to typed Agreement objects
 */
export function adaptApiResponseToAgreements(data: any[]): Agreement[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map(adaptApiResponseToAgreement);
}
