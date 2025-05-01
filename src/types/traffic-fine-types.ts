import { TrafficFineId } from './database-common';

/**
 * Standardized traffic fine status type
 */
export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

/**
 * Traffic fine entity interface
 */
export interface TrafficFine {
  id: TrafficFineId;
  violationNumber: string;
  licensePlate?: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  vehicleId?: string;
  vehicleModel?: string;
  customerId?: string;
  customerName?: string;
  paymentDate?: Date;
  leaseId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

/**
 * Payload for traffic fine operations
 */
export interface TrafficFinePayload {
  id: TrafficFineId;
}

/**
 * Payload for creating a new traffic fine
 */
export interface TrafficFineCreatePayload {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
  paymentStatus?: TrafficFineStatusType;
}

/**
 * Database row representation of a traffic fine
 */
export interface TrafficFineRow {
  id: string;
  violation_number: string;
  license_plate?: string;
  violation_date: string;
  fine_amount: number;
  violation_charge?: string;
  payment_status: string;
  fine_location?: string;
  vehicle_id?: string;
  lease_id?: string;
  payment_date?: string;
  assignment_status?: string;
}
