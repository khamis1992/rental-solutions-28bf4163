
import { supabase } from '@/lib/supabase';
import { normalizeLicensePlate } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('traffic-fine-validation');

/**
 * Date validation result including reason for invalidity
 */
export interface DateValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validate if a traffic fine date falls within a lease period
 */
export function validateFineDate(
  violationDate: Date | string,
  leaseStartDate: Date | string,
  leaseEndDate?: Date | string
): DateValidationResult {
  // Convert dates to consistent format
  const violation = new Date(violationDate);
  const start = new Date(leaseStartDate);
  const end = leaseEndDate ? new Date(leaseEndDate) : new Date();
  
  // Check if violation date is before lease start
  if (violation < start) {
    return { 
      isValid: false,
      reason: `Violation date (${violation.toLocaleDateString()}) is before lease start date (${start.toLocaleDateString()})`
    };
  }
  
  // Check if violation date is after lease end
  if (violation > end) {
    return { 
      isValid: false,
      reason: `Violation date (${violation.toLocaleDateString()}) is after lease end date (${end.toLocaleDateString()})`
    };
  }
  
  return { isValid: true };
}

/**
 * Finds the best matching lease for assigning traffic fines
 */
export async function findBestMatchingLease(
  licensePlate: string, 
  violationDate: Date | string
): Promise<{ leaseId: string | null; reason?: string }> {
  try {
    const normalizedPlate = normalizeLicensePlate(licensePlate);
    logger.debug(`Finding best matching lease for license plate ${normalizedPlate} on ${violationDate}`);
    
    // Find vehicles with this license plate
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', normalizedPlate);
    
    if (vehicleError) {
      logger.error(`Error finding vehicle: ${vehicleError.message}`);
      return { leaseId: null, reason: `Error finding vehicle: ${vehicleError.message}` };
    }
    
    if (!vehicles || vehicles.length === 0) {
      logger.warn(`No vehicles found with license plate ${normalizedPlate}`);
      return { leaseId: null, reason: `No vehicle found with license plate ${normalizedPlate}` };
    }
    
    const vehicleId = vehicles[0].id;
    
    // Find leases for this vehicle
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select('id, start_date, end_date, customer_id')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null);
    
    if (leaseError) {
      logger.error(`Error finding leases: ${leaseError.message}`);
      return { leaseId: null, reason: `Error finding leases: ${leaseError.message}` };
    }
    
    if (!leases || leases.length === 0) {
      logger.warn(`No lease found for vehicle ${vehicleId}`);
      return { leaseId: null, reason: 'No lease found for this vehicle' };
    }
    
    // Convert violation date
    const violationDateObj = new Date(violationDate);
    
    // Find the lease that covers this violation date
    const matchingLease = leases.find(lease => {
      const validation = validateFineDate(
        violationDateObj,
        lease.start_date,
        lease.end_date
      );
      return validation.isValid;
    });
    
    if (!matchingLease) {
      logger.warn(`No lease covers the violation date ${violationDateObj.toISOString()}`);
      return { 
        leaseId: null, 
        reason: 'No lease covers the violation date' 
      };
    }
    
    logger.info(`Found matching lease ${matchingLease.id} for date ${violationDateObj.toISOString()}`);
    return { leaseId: matchingLease.id };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error finding matching lease: ${message}`);
    return { leaseId: null, reason: `Error finding matching lease: ${message}` };
  }
}
