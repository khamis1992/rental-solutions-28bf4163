
import { TrafficFine } from '@/types/traffic-fine.types';

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
    customerId: fine.customer_id,
    customerName: fine.customerName
  };
}

export function adaptTrafficFinesToUI(fines: TrafficFine[]): UITrafficFine[] {
  return fines.map(adaptTrafficFineToUI);
}
