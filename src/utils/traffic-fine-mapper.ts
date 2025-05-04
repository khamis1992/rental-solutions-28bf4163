
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
    serial_number: fineData.serialNumber || fineData.serial_number,
    validation_status: fineData.validationStatus || fineData.validation_status,
    payment_date: fineData.paymentDate || fineData.payment_date
  };
}
