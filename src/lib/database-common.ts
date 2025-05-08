
import { Database } from '@/types/database.types';
import { UUID } from './database-types';

// Standardized ID types
export type LeaseId = UUID;
export type VehicleId = UUID;
export type ProfileId = UUID;
export type PaymentId = UUID;

// Standardized status types
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

export type VehicleStatus = 
  | 'available' 
  | 'rented' 
  | 'reserved' 
  | 'maintenance' 
  | 'police_station' 
  | 'accident' 
  | 'stolen' 
  | 'retired';

// Type-safe casting functions
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

export function asVehicleId(id: string): VehicleId {
  return id as VehicleId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asPaymentId(id: string): PaymentId {
  return id as PaymentId;
}
