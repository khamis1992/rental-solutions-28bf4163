/**
 * Shared types for traffic fines
 */

// Status types
export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

// Traffic fine model
export interface TrafficFine {
  id: string;
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

// Payload for operations on existing fines
export interface TrafficFinePayload {
  id: string;
}

// Payload for creating new fines
export interface TrafficFineCreatePayload {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
  paymentStatus?: string;
}
