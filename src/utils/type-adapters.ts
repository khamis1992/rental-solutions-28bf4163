
import { Database } from '@/types/database.types';
import { PaymentRow, LeaseRow } from '@/lib/database/types';
import { LeaseStatus, ValidationLeaseStatus } from '@/types/lease-types';
import { Agreement as ValidationAgreement } from '@/lib/validation-schemas/agreement';
import { Agreement as ModelAgreement } from '@/types/agreement';

type Tables = Database['public']['Tables'];

/**
 * Type-safe ID conversions for database tables
 */
export function asTypedId<T extends keyof Tables>(
  tableName: T,
  id: string | null | undefined
): Tables[T]['Row']['id'] {
  return id as unknown as Tables[T]['Row']['id'];
}

// Specific helpers for common database IDs
export function asLeaseId(id: string | null | undefined): Tables['leases']['Row']['id'] {
  return asTypedId('leases', id);
}

export function asPaymentId(id: string | null | undefined): Tables['unified_payments']['Row']['id'] {
  return asTypedId('unified_payments', id);
}

export function asVehicleId(id: string | null | undefined): Tables['vehicles']['Row']['id'] {
  return asTypedId('vehicles', id);
}

export function asProfileId(id: string | null | undefined): Tables['profiles']['Row']['id'] {
  return asTypedId('profiles', id);
}

/**
 * Type conversion for agreement models
 */
export function adaptAgreementForValidation(agreement: ModelAgreement): ValidationAgreement {
  // Map LeaseStatus to ValidationLeaseStatus
  let validStatus: ValidationLeaseStatus = 'draft';
  
  // Handle 'completed' status by mapping to 'closed'
  if (agreement.status === 'completed') {
    validStatus = 'closed';
  } else if (['draft', 'active', 'pending', 'expired', 'cancelled', 'closed'].includes(agreement.status)) {
    validStatus = agreement.status as ValidationLeaseStatus;
  }
  
  // Create a new object with the valid status
  return {
    ...agreement,
    status: validStatus
  } as ValidationAgreement;
}

/**
 * Create type-safe database update and insert objects
 */
export function createPaymentUpdate(data: Partial<PaymentRow>): Tables['unified_payments']['Update'] {
  return data as unknown as Tables['unified_payments']['Update'];
}

export function createPaymentInsert(data: Partial<PaymentRow>): Tables['unified_payments']['Insert'] {
  return data as unknown as Tables['unified_payments']['Insert'];
}

export function createLeaseUpdate(data: Partial<LeaseRow>): Tables['leases']['Update'] {
  return data as unknown as Tables['leases']['Update'];
}

export function createLeaseInsert(data: Partial<LeaseRow>): Tables['leases']['Insert'] {
  return data as unknown as Tables['leases']['Insert'];
}

/**
 * Safe type extraction from complex database responses
 */
export function extractMonthlyRate(vehicleTypeData: any): number | undefined {
  // Safely extract the monthly_rate from vehicle_types
  if (vehicleTypeData?.vehicle_types && typeof vehicleTypeData.vehicle_types === 'object') {
    return vehicleTypeData.vehicle_types.monthly_rate;
  }
  return undefined;
}
