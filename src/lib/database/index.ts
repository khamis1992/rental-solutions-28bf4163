
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
import { trafficFineRepository } from './repositories/traffic-fine-repository';

// Import the necessary utilities
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
  asTrafficFinePaymentStatus,
  asEntityStatus
} from '@/types/database-common';

// Export repositories
export { 
  leaseRepository, 
  vehicleRepository, 
  profileRepository, 
  paymentRepository,
  trafficFineRepository
};

// Export collection of repository instances for easy access
export const repositories = {
  lease: leaseRepository,
  vehicle: vehicleRepository,
  profile: profileRepository,
  payment: paymentRepository,
  trafficFine: trafficFineRepository
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
  asVehicleStatus,
  asTrafficFinePaymentStatus
} from '@/types/database-common';

// Fix common ID column errors by providing direct casting functions
export const asLeaseIdColumn = asLeaseId;
export const asVehicleIdColumn = asVehicleId;
export const asProfileIdColumn = asProfileId;
export const asPaymentIdColumn = asPaymentId;
export const asTrafficFineIdColumn = asTrafficFineId;
export const asMaintenanceIdColumn = asMaintenanceId;

// Alias for legacy code
export const asStatusColumn = asEntityStatus;

// Safe utility for string to enum casting (will be provided by new system)
export function safeEnumCast<T extends string>(value: string, fallback?: T): T {
  return value as T;
}

// Special function to handle type errors in legacy code
export function castLeaseUpdate(data: any): any {
  return data;
}

// Handle type errors in legacy code
export function castRowData<T>(data: T): T {
  return data;
}

// Create the traffic fine repository
import { Repository } from './repository';
export const createTrafficFineRepository = () => new Repository('traffic_fines');
