
/**
 * Model type definitions
 */

// Traffic Fines
export interface TrafficFine {
  id: string;
  violationNumber?: string;
  licensePlate?: string;
  violationDate?: string | Date;
  fineAmount?: number;
  violationCharge?: string;
  paymentStatus?: string;
  location?: string;
  vehicleId?: string;
  leaseId?: string;
  paymentDate?: string | Date;
  customerName?: string;
  customerId?: string;
}
