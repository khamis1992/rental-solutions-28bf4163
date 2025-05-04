
import { TrafficFine } from '@/types/traffic-fine';

/**
 * Maps traffic fine data to consistent format used across the application
 * This helps resolve property name inconsistencies between different parts of the app
 */
export function mapTrafficFineData(fineData: any): TrafficFine {
  return {
    id: fineData.id,
    violation_number: fineData.violationNumber || fineData.violation_number,
    license_plate: fineData.licensePlate || fineData.license_plate,
    violation_date: fineData.violationDate instanceof Date 
      ? fineData.violationDate 
      : new Date(fineData.violationDate || fineData.violation_date),
    fine_amount: fineData.fineAmount || fineData.fine_amount,
    violation_charge: fineData.violationCharge || fineData.violation_charge,
    payment_status: fineData.paymentStatus || fineData.payment_status,
    location: fineData.location || fineData.fine_location,
    lease_id: fineData.leaseId || fineData.lease_id,
    customer_id: fineData.customerId || fineData.customer_id,
    validation_status: fineData.validationStatus || fineData.validation_status,
    created_at: fineData.created_at,
    updated_at: fineData.updated_at
  };
}

/**
 * Maps TrafficFine object to the format expected by components
 */
export function mapTrafficFineToComponentFormat(fine: TrafficFine): any {
  return {
    id: fine.id,
    violationNumber: fine.violation_number,
    licensePlate: fine.license_plate,
    violationDate: fine.violation_date instanceof Date 
      ? fine.violation_date 
      : new Date(fine.violation_date),
    fineAmount: fine.fine_amount,
    violationCharge: fine.violation_charge,
    paymentStatus: fine.payment_status,
    location: fine.location,
    leaseId: fine.lease_id,
    customerId: fine.customer_id,
    validationStatus: fine.validation_status
  };
}
