
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];

/**
 * Type-safe status casting functions
 */
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asVehicleStatus(status: string): Tables['vehicles']['Row']['status'] {
  return status as Tables['vehicles']['Row']['status'];
}

export function asPaymentStatus(status: string): Tables['unified_payments']['Row']['status'] {
  return status as Tables['unified_payments']['Row']['status'];
}

export function asProfileStatus(status: string): Tables['profiles']['Row']['status'] {
  return status as Tables['profiles']['Row']['status'];
}

export function asTrafficFineStatus(status: string): Tables['traffic_fines']['Row']['payment_status'] {
  return status as Tables['traffic_fines']['Row']['payment_status'];
}

export function asLegalCaseStatus(status: string): Tables['legal_cases']['Row']['status'] {
  return status as Tables['legal_cases']['Row']['status'];
}

/**
 * Type-safe ID casting functions
 */
export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asProfileId(id: string): Tables['profiles']['Row']['id'] {
  return id as Tables['profiles']['Row']['id'];
}

export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

/**
 * Validator functions to check if values are valid
 */
export function isValidStatus<T extends {status: string}>(
  entity: T, 
  validStatuses: string[]
): boolean {
  return validStatuses.includes(entity.status);
}
