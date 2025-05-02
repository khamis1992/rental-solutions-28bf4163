
import { supabase } from '@/integrations/supabase/client';
import { normalizeLicensePlate } from '@/utils/searchUtils';

/**
 * Result of validating a fine against lease dates
 */
interface DateValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Result of finding a matching lease for a license plate
 */
interface LeaseMatchResult {
  leaseId: string | null;
  reason?: string;
}

/**
 * Validate that a traffic fine date is within lease period
 * Handles timezone issues and edge cases
 * 
 * @param fineDate The date of the traffic fine
 * @param leaseStartDate The lease start date
 * @param leaseEndDate The lease end date (optional)
 * @returns Validation result with success flag and reason
 */
export const validateFineDate = (
  fineDate: Date | string,
  leaseStartDate: Date | string,
  leaseEndDate?: Date | string | null
): DateValidationResult => {
  try {
    // Convert to Date objects for consistent handling
    const fineDateObj = typeof fineDate === 'string' ? new Date(fineDate) : fineDate;
    const startDateObj = typeof leaseStartDate === 'string' ? new Date(leaseStartDate) : leaseStartDate;
    
    // Set times to midnight for date-only comparison (to handle timezone issues)
    const normalizedFineDate = new Date(fineDateObj);
    normalizedFineDate.setHours(0, 0, 0, 0);
    
    const normalizedStartDate = new Date(startDateObj);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    // Check if fine date is before lease start date
    if (normalizedFineDate < normalizedStartDate) {
      return {
        isValid: false,
        reason: 'Fine date is before lease start date'
      };
    }
    
    // If lease end date exists, check if fine date is after lease end date
    if (leaseEndDate) {
      const endDateObj = typeof leaseEndDate === 'string' ? new Date(leaseEndDate) : leaseEndDate;
      const normalizedEndDate = new Date(endDateObj);
      normalizedEndDate.setHours(23, 59, 59, 999); // End of day
      
      if (normalizedFineDate > normalizedEndDate) {
        return {
          isValid: false,
          reason: 'Fine date is after lease end date'
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      reason: `Date validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Find the best matching lease for a given license plate and date
 * Uses license plate normalization for more accurate matching
 * 
 * @param licensePlate The vehicle license plate
 * @param violationDate The date of the violation
 * @returns Matching result with lease ID or explanation
 */
export const findBestMatchingLease = async (
  licensePlate: string,
  violationDate: Date | string
): Promise<LeaseMatchResult> => {
  try {
    if (!licensePlate) {
      return {
        leaseId: null,
        reason: 'No license plate provided'
      };
    }
    
    // Normalize the license plate for better matching
    const normalizedLicensePlate = normalizeLicensePlate(licensePlate);
    
    // Get all vehicles with this normalized license plate
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, license_plate')
      .ilike('license_plate', `%${normalizedLicensePlate}%`);
      
    if (vehicleError || !vehicles || vehicles.length === 0) {
      return {
        leaseId: null,
        reason: 'No vehicle found with this license plate'
      };
    }
    
    // Use the first exact match if available, otherwise use the first vehicle
    const exactMatch = vehicles.find(v => normalizeLicensePlate(v.license_plate) === normalizedLicensePlate);
    const vehicleId = exactMatch ? exactMatch.id : vehicles[0].id;
    
    // Convert violationDate to Date object for consistent handling
    const violationDateObj = typeof violationDate === 'string' ? new Date(violationDate) : violationDate;
    
    // Find active lease for this vehicle on the violation date
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select('id, start_date, end_date')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)
      .order('start_date', { ascending: false });
      
    if (leaseError || !leases || leases.length === 0) {
      return {
        leaseId: null,
        reason: 'No lease found for this vehicle'
      };
    }
    
    // Find a lease that covers the violation date
    for (const lease of leases) {
      const validation = validateFineDate(
        violationDateObj,
        lease.start_date,
        lease.end_date
      );
      
      if (validation.isValid) {
        return { leaseId: lease.id };
      }
    }
    
    return {
      leaseId: null,
      reason: 'No lease covers the violation date'
    };
  } catch (error) {
    return {
      leaseId: null,
      reason: `Error finding matching lease: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
