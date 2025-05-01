
// Export types
export * from './types';
export * from './utils';
export * from './repository';
export * from '@/types/database-common';

// Import repositories first before exporting them
import { leaseRepository } from './repositories/lease-repository';
import { vehicleRepository } from './repositories/vehicle-repository';
import { profileRepository } from './repositories/profile-repository';
import { paymentRepository } from './repositories/payment-repository';

// Export repositories
export { leaseRepository, vehicleRepository, profileRepository, paymentRepository };

// Export collection of repository instances for easy access
export const repositories = {
  lease: leaseRepository,
  vehicle: vehicleRepository,
  profile: profileRepository,
  payment: paymentRepository
};

// Legacy type casting functions for backward compatibility - re-exporting from database-common
export {
  asLeaseId,
  asVehicleId,
  asProfileId,
  asPaymentId,
  asTrafficFineId,
  asMaintenanceId,
  asLeaseStatus,
  asPaymentStatus,
  asVehicleStatus
} from '@/types/database-common';

// Fix common ID column errors by providing direct casting functions
export const asLeaseIdColumn = asLeaseId;
export const asVehicleIdColumn = asVehicleId;
export const asProfileIdColumn = asProfileId;
export const asPaymentIdColumn = asPaymentId;
export const asTrafficFineIdColumn = asTrafficFineId;
export const asMaintenanceIdColumn = asMaintenanceId;

// Alias for legacy code
import { asEntityStatus } from '@/types/database-common';
export const asStatusColumn = asEntityStatus;

// Special function to handle type errors in legacy code
export function castLeaseUpdate(data: any): any {
  return data;
}

// Handle type errors in legacy code
export function castRowData<T>(data: T): T {
  return data;
}
