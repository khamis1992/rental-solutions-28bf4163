
import { TrafficFine } from '@/hooks/use-traffic-fines';

// Interface for how traffic fines appear in the UI components
export interface UITrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: string;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: string;
  location?: string;
  vehicleId?: string | null;
  leaseId?: string | null;
  paymentDate?: string | null;
  assignmentStatus?: string | null;
  customerName?: string;
  customerId?: string;
}

/**
 * Adapts database traffic fine to UI traffic fine
 */
export function adaptTrafficFineToUI(fine: TrafficFine): UITrafficFine {
  return {
    id: fine.id,
    violationNumber: fine.violation_number,
    licensePlate: fine.license_plate,
    violationDate: fine.violation_date,
    fineAmount: fine.fine_amount,
    violationCharge: fine.violation_charge,
    paymentStatus: fine.payment_status,
    location: fine.fine_location,
    vehicleId: fine.vehicle_id,
    leaseId: fine.lease_id,
    paymentDate: fine.payment_date,
    assignmentStatus: fine.assignment_status,
    // Add other fields as needed
  };
}

/**
 * Adapts UI traffic fine to database traffic fine
 */
export function adaptUITrafficFineToDatabase(uiFine: UITrafficFine): TrafficFine {
  return {
    id: uiFine.id,
    violation_number: uiFine.violationNumber,
    license_plate: uiFine.licensePlate,
    violation_date: uiFine.violationDate,
    fine_amount: uiFine.fineAmount,
    violation_charge: uiFine.violationCharge,
    payment_status: uiFine.paymentStatus,
    fine_location: uiFine.location || '',
    vehicle_id: uiFine.vehicleId,
    lease_id: uiFine.leaseId,
    payment_date: uiFine.paymentDate,
    assignment_status: uiFine.assignmentStatus
  };
}

/**
 * Adapts an array of database traffic fines to UI traffic fines
 */
export function adaptTrafficFinesToUI(fines: TrafficFine[]): UITrafficFine[] {
  return fines.map(adaptTrafficFineToUI);
}

/**
 * Adapts an array of UI traffic fines to database traffic fines
 */
export function adaptUITrafficFinesToDatabase(uiFines: UITrafficFine[]): TrafficFine[] {
  return uiFines.map(adaptUITrafficFineToDatabase);
}
