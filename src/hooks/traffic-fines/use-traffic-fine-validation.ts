
import { supabase } from '@/integrations/supabase/client';
import { normalizeLicensePlate } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('traffic-fine-validation');

/**
 * Result of a date validation operation
 */
export interface DateValidationResult {
  isValid: boolean;
  message: string; // Changed from 'reason' to 'message' for consistency
}

/**
 * Validates if a traffic fine date falls within a lease period
 * 
 * @param violationDate Date of the traffic violation
 * @param leaseStartDate Start date of the lease
 * @param leaseEndDate End date of the lease (optional for ongoing leases)
 * @returns Validation result object with isValid flag and message
 */
export function validateFineDate(
  violationDate: Date | string,
  leaseStartDate: Date | string,
  leaseEndDate?: Date | string | null
): DateValidationResult {
  try {
    // Convert string dates to Date objects if needed
    const violationDateObj = violationDate instanceof Date ? violationDate : new Date(violationDate);
    const leaseStartDateObj = leaseStartDate instanceof Date ? leaseStartDate : new Date(leaseStartDate);
    
    // For end date, handle null/undefined (ongoing lease)
    const leaseEndDateObj = leaseEndDate 
      ? (leaseEndDate instanceof Date ? leaseEndDate : new Date(leaseEndDate))
      : null;
    
    // Check if dates are valid
    if (isNaN(violationDateObj.getTime())) {
      logger.warn('Invalid violation date provided for validation');
      return { isValid: false, message: 'Invalid violation date' };
    }
    
    if (isNaN(leaseStartDateObj.getTime())) {
      logger.warn('Invalid lease start date provided for validation');
      return { isValid: false, message: 'Invalid lease start date' };
    }
    
    if (leaseEndDateObj && isNaN(leaseEndDateObj.getTime())) {
      logger.warn('Invalid lease end date provided for validation');
      return { isValid: false, message: 'Invalid lease end date' };
    }
    
    // Check if violation date is before lease start
    if (violationDateObj < leaseStartDateObj) {
      logger.debug(`Violation date ${violationDateObj.toISOString()} is before lease start ${leaseStartDateObj.toISOString()}`);
      return { 
        isValid: false, 
        message: 'Violation occurred before the lease started' 
      };
    }
    
    // Check if violation date is after lease end (if lease has ended)
    if (leaseEndDateObj && violationDateObj > leaseEndDateObj) {
      logger.debug(`Violation date ${violationDateObj.toISOString()} is after lease end ${leaseEndDateObj.toISOString()}`);
      return { 
        isValid: false, 
        message: 'Violation occurred after the lease ended' 
      };
    }
    
    // If we got here, the date is valid
    return { isValid: true, message: 'Valid' };
  } catch (error) {
    logger.error('Error validating fine date:', error);
    return { 
      isValid: false, 
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Finds the best matching lease for a traffic fine based on license plate and date
 */
export async function findBestMatchingLease(licensePlate: string, violationDate: Date | string) {
  try {
    const normalizedPlate = normalizeLicensePlate(licensePlate);
    logger.debug(`Finding best matching lease for ${normalizedPlate} on ${violationDate}`);
    
    // First, try to find the vehicle by license plate
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, license_plate, make, model')
      .ilike('license_plate', `%${normalizedPlate}%`);
      
    if (vehicleError || !vehicles || vehicles.length === 0) {
      logger.debug(`No vehicle found with license plate ${normalizedPlate}`);
      return { leaseId: null, reason: 'No matching vehicle found' };
    }
    
    // For each vehicle, check for active leases at the time of violation
    for (const vehicle of vehicles) {
      const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('id, start_date, end_date, customer_id')
        .eq('vehicle_id', vehicle.id);
        
      if (leaseError || !leases || leases.length === 0) {
        logger.debug(`No leases found for vehicle ${vehicle.id}`);
        continue;
      }
      
      // Convert violation date to date object for comparison
      const violationDateObj = violationDate instanceof Date 
        ? violationDate 
        : new Date(violationDate);
      
      // Find a lease that covers the violation date
      for (const lease of leases) {
        const validation = validateFineDate(
          violationDateObj,
          lease.start_date,
          lease.end_date
        );
        
        if (validation.isValid) {
          logger.info(
            `Found matching lease ${lease.id} for license plate ${normalizedPlate} on ${violationDateObj.toISOString()}`
          );
          return { leaseId: lease.id, reason: 'Matching lease found' };
        }
      }
    }
    
    // No matching lease found
    logger.debug(`No matching lease found for ${normalizedPlate} on the violation date`);
    return { leaseId: null, reason: 'No active lease for this vehicle at the time of violation' };
  } catch (error) {
    logger.error('Error finding matching lease:', error);
    return { 
      leaseId: null, 
      reason: `Error finding matching lease: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
