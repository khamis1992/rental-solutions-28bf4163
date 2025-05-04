
import { DbId, TrafficFinePaymentStatus } from '@/types/database-common';

export interface TrafficFine {
  id: string;
  violation_number: string;
  license_plate: string;
  violation_date: Date | string;
  fine_amount: number;
  violation_charge: string;
  payment_status: TrafficFinePaymentStatus;
  location: string;
  lease_id?: string | null;
  customer_id?: string | null;
  validation_status?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export function mapTrafficFineResponse(apiResponse: any): TrafficFine {
  return {
    id: apiResponse.id,
    violation_number: apiResponse.violationNumber || apiResponse.violation_number,
    license_plate: apiResponse.licensePlate || apiResponse.license_plate,
    violation_date: apiResponse.violationDate || apiResponse.violation_date,
    fine_amount: apiResponse.fineAmount || apiResponse.fine_amount,
    violation_charge: apiResponse.violationCharge || apiResponse.violation_charge,
    payment_status: apiResponse.paymentStatus || apiResponse.payment_status,
    location: apiResponse.location,
    lease_id: apiResponse.leaseId || apiResponse.lease_id,
    customer_id: apiResponse.customerId || apiResponse.customer_id,
    validation_status: apiResponse.validationStatus || apiResponse.validation_status,
    created_at: apiResponse.created_at,
    updated_at: apiResponse.updated_at
  };
}
