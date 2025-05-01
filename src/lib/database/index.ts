// Export types
export type {
  DbResponse,
  DbListResponse,
  DbSingleResponse,
  TableRow,
  TableInsert,
  TableUpdate
} from './types';

export type {
  LeaseId,
  VehicleId,
  ProfileId,
  PaymentId,
  TrafficFineId,
  MaintenanceId,
  LeaseStatus,
  VehicleStatus,
  ProfileStatus,
  PaymentStatus,
  MaintenanceStatus
} from './utils';

import { Repository } from './repository';

export { Repository } from './repository';

export {
  leaseRepository,
  vehicleRepository,
  profileRepository,
  paymentRepository,
  trafficFineRepository,
  legalCaseRepository,
  maintenanceRepository
} from './repository';

export const repositories = {
  lease: new Repository('leases'),
  vehicle: new Repository('vehicles'),
  profile: new Repository('profiles'),
  payment: new Repository('unified_payments'),
  trafficFine: new Repository('traffic_fines'),
  legalCase: new Repository('legal_cases'),
  maintenance: new Repository('maintenance')
};

export * from '@/types/database-common';
