
/**
 * Traffic fine related type definitions
 */

export interface TrafficFine {
  id: string;
  violationNumber?: string;
  violationDate?: Date | string;
  licensePlate?: string;
  location?: string;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: 'pending' | 'paid' | 'disputed';
  paymentDate?: Date | string;
  leaseId?: string;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
  customerId?: string;
  customerName?: string;
  validationStatus?: string;
}

export interface TrafficFineCreatePayload {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
  paymentStatus: 'pending' | 'paid' | 'disputed';
}

export interface AssignFineParams {
  id: string;
}

export interface MarkPaidParams {
  id: string;
  paymentDate?: string;
}

export interface DisputeFineParams {
  id: string;
}
