
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeLicensePlate, fuzzyMatchLicensePlates } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('traffic-fine:validation');

interface ValidationResult {
  id: string;
  validationDate: string;
  licensePlate: string;
  status: string;
  result: any;
  error?: string;
}

interface DateValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates if a violation date falls within a lease period
 * Properly handles timezone issues by comparing dates without time components
 */
export function validateFineDate(
  violationDate: Date,
  startDateStr?: string | null, 
  endDateStr?: string | null
): DateValidationResult {
  if (!startDateStr) {
    return { isValid: false, message: 'No lease start date provided' };
  }
  
  // Parse dates and reset to midnight UTC to avoid timezone issues
  const startDate = new Date(startDateStr);
  startDate.setUTCHours(0, 0, 0, 0);
  
  const endDate = endDateStr ? new Date(endDateStr) : new Date();
  endDate.setUTCHours(23, 59, 59, 999);
  
  const violation = new Date(violationDate);
  violation.setUTCHours(12, 0, 0, 0);
  
  // Check if violation date is within range
  if (violation >= startDate && violation <= endDate) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    message: `Violation date ${violation.toISOString().split('T')[0]} is outside lease period: ${
      startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
  };
}

/**
 * Hook for traffic fine validation functionality
 */
export const useTrafficFineValidation = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Validates a traffic fine by license plate
   */
  const validateLicensePlate = async (licensePlate: string): Promise<ValidationResult> => {
    setIsValidating(true);
    setError(null);
    
    const normalizedPlate = normalizeLicensePlate(licensePlate);
    logger.debug(`Validating license plate: ${normalizedPlate}`);
    
    try {
      // Step 1: Check if vehicle exists with this license plate
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year')
        .ilike('license_plate', normalizedPlate);
      
      if (vehicleError) {
        logger.error(`Vehicle lookup failed: ${vehicleError.message}`);
        throw new Error(`Vehicle lookup failed: ${vehicleError.message}`);
      }
      
      // Handle no vehicle found
      if (!vehicles || vehicles.length === 0) {
        logger.info(`No vehicle found with license plate: ${normalizedPlate}`);
        const result = {
          id: `validation-${Date.now()}`,
          validationDate: new Date().toISOString(),
          licensePlate: normalizedPlate,
          status: 'failed',
          result: { message: 'No vehicle found with this license plate' }
        };
        setValidationResults(prev => [result, ...prev]);
        return result;
      }
      
      // Try fuzzy matching if exact match didn't work
      const fuzzyMatches = vehicles.filter(v => fuzzyMatchLicensePlates(v.license_plate, normalizedPlate));
      logger.debug(`Found ${vehicles.length} vehicles, ${fuzzyMatches.length} fuzzy matches`);
      
      // Get all leases for the vehicle(s)
      let currentLeases: any[] = [];
      
      for (const vehicle of fuzzyMatches.length > 0 ? fuzzyMatches : vehicles) {
        logger.debug(`Fetching leases for vehicle: ${vehicle.id} (${vehicle.make} ${vehicle.model})`);
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select(`
            id, 
            agreement_number,
            start_date,
            end_date,
            status,
            customer_id,
            profiles:customer_id (full_name, email, phone_number)
          `)
          .eq('vehicle_id', vehicle.id)
          .order('start_date', { ascending: false });
        
        if (leaseError) {
          logger.error(`Lease lookup failed: ${leaseError.message}`);
          throw new Error(`Lease lookup failed: ${leaseError.message}`);
        }
        
        if (leases && leases.length > 0) {
          logger.debug(`Found ${leases.length} leases for vehicle: ${vehicle.id}`);
          currentLeases = [...currentLeases, ...leases.map(lease => ({
            ...lease,
            vehicle: vehicle
          }))];
        }
      }
      
      // Create validation result
      const result: ValidationResult = {
        id: `validation-${Date.now()}`,
        validationDate: new Date().toISOString(),
        licensePlate: normalizedPlate,
        status: 'success',
        result: {
          vehicles: fuzzyMatches.length > 0 ? fuzzyMatches : vehicles,
          leases: currentLeases,
          matchType: fuzzyMatches.length > 0 && fuzzyMatches.length < vehicles.length ? 'fuzzy' : 'exact'
        }
      };
      
      logger.info(`Successfully validated license plate: ${normalizedPlate}`);
      setValidationResults(prev => [result, ...prev]);
      return result;
      
    } catch (err) {
      const error = err as Error;
      logger.error(`Validation error: ${error.message}`);
      setError(error);
      const result = {
        id: `validation-${Date.now()}`,
        validationDate: new Date().toISOString(),
        licensePlate: normalizedPlate,
        status: 'error',
        error: error.message
      };
      setValidationResults(prev => [result, ...prev]);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  // Return validation history
  const getValidationHistory = () => validationResults;
  
  // Clear validation history
  const clearValidationHistory = () => {
    logger.debug('Clearing validation history');
    setValidationResults([]);
  };

  return {
    validateLicensePlate,
    isValidating,
    error,
    validationResults,
    getValidationHistory,
    clearValidationHistory
  };
};

export default useTrafficFineValidation;
