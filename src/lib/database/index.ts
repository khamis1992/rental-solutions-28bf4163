
// Export types
export * from './types';
export * from './utils';
export * from './repository';
export * from '@/types/database-common';

// Export repositories
export { leaseRepository } from './repositories/lease-repository';
export { vehicleRepository } from './repositories/vehicle-repository';
export { profileRepository } from './repositories/profile-repository';
export { paymentRepository } from './repositories/payment-repository';

// Legacy type casting functions for backward compatibility
import { 
  asLeaseId, 
  asVehicleId, 
  asProfileId, 
  asPaymentId, 
  asTrafficFineId, 
  asMaintenanceId,
  asLeaseStatus,
  asPaymentStatus,
  asVehicleStatus,
  asProfileStatus,
  asMaintenanceStatus,
  asEntityStatus
} from '@/types/database-common';

// Export with legacy names for backward compatibility
export {
  asLeaseId,
  asVehicleId,
  asProfileId,
  asPaymentId,
  asTrafficFineId,
  asMaintenanceId,
  asLeaseStatus,
  asPaymentStatus,
  asVehicleStatus,
  asProfileStatus,
  asMaintenanceStatus
};

// Fix common ID column errors by providing direct casting functions
export const asLeaseIdColumn = asLeaseId;
export const asVehicleIdColumn = asVehicleId;
export const asProfileIdColumn = asProfileId;
export const asPaymentIdColumn = asPaymentId;
export const asTrafficFineIdColumn = asTrafficFineId;
export const asMaintenanceIdColumn = asMaintenanceId;

// Alias for legacy code
export const asStatusColumn = asEntityStatus;

// Special function to handle type errors in legacy code
export function castLeaseUpdate(data: any): any {
  return data;
}

// Handle type errors in legacy code
export function castRowData<T>(data: T): T {
  return data;
}

// Export collection of repository instances for easy access
export const repositories = {
  lease: leaseRepository,
  vehicle: vehicleRepository,
  profile: profileRepository,
  payment: paymentRepository
};
