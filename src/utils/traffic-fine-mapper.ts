
import { TrafficFine } from '@/types/traffic-fine';

/**
 * Maps the raw traffic fine data from the API to the format expected by components
 */
export const mapTrafficFineToComponentFormat = (fine: TrafficFine): any => {
  return {
    id: fine.id,
    violationNumber: fine.violation_number || '',
    licensePlate: fine.license_plate,
    violationDate: fine.violation_date || new Date(),
    fineAmount: fine.fine_amount || 0,
    violationCharge: fine.violation_charge || 'Unknown violation',
    paymentStatus: fine.payment_status || 'unpaid',
    location: fine.fine_location || fine.violation_charge || 'Unknown location',
  };
};
