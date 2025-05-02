
import { isEmptyString, isValidDateFormat, isValidPositiveNumber } from '@/utils/data-validation';
import { toast } from 'sonner';

/**
 * Represents the validation result for a traffic fine
 */
export interface TrafficFineValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Traffic fine validation schema
 */
export interface TrafficFineValidationSchema {
  violationNumber?: string;
  licensePlate?: string;
  violationDate?: Date | string;
  fineAmount?: number;
  violationCharge?: string;
  location?: string;
  paymentStatus?: string;
}

/**
 * Validates a traffic fine object against defined business rules
 * @param fine The traffic fine object to validate
 * @returns Validation result with isValid flag and any validation errors
 */
export const validateTrafficFine = (fine: TrafficFineValidationSchema): TrafficFineValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate license plate (required)
  if (!fine.licensePlate || isEmptyString(fine.licensePlate)) {
    errors.licensePlate = 'License plate is required';
  } else if (fine.licensePlate && fine.licensePlate.length < 2) {
    errors.licensePlate = 'License plate must be at least 2 characters';
  }
  
  // Validate violation date (required and valid date format)
  if (!fine.violationDate) {
    errors.violationDate = 'Violation date is required';
  } else if (typeof fine.violationDate === 'string' && !isValidDateFormat(fine.violationDate)) {
    errors.violationDate = 'Invalid date format. Expected YYYY-MM-DD';
  } else {
    const currentDate = new Date();
    const violationDate = fine.violationDate instanceof Date 
      ? fine.violationDate 
      : new Date(fine.violationDate);
      
    if (violationDate > currentDate) {
      errors.violationDate = 'Violation date cannot be in the future';
    }
  }
  
  // Validate fine amount (required and positive number)
  if (fine.fineAmount === undefined || fine.fineAmount === null) {
    errors.fineAmount = 'Fine amount is required';
  } else if (!isValidPositiveNumber(fine.fineAmount)) {
    errors.fineAmount = 'Fine amount must be a positive number';
  }
  
  // Optional field validations
  if (fine.violationCharge && fine.violationCharge.length > 500) {
    errors.violationCharge = 'Violation charge description is too long (max 500 characters)';
  }
  
  if (fine.location && fine.location.length > 200) {
    errors.location = 'Location is too long (max 200 characters)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates and shows toast messages for traffic fine data
 * @param fine The traffic fine object to validate
 * @returns Boolean indicating if validation passed
 */
export const validateTrafficFineWithToast = (fine: TrafficFineValidationSchema): boolean => {
  const { isValid, errors } = validateTrafficFine(fine);
  
  if (!isValid) {
    const errorMessages = Object.values(errors);
    toast.error('Validation failed', {
      description: errorMessages.join(', ')
    });
  }
  
  return isValid;
};

/**
 * Validates an array of traffic fines
 * @param fines Array of traffic fines to validate
 * @returns Object containing validation results and error count
 */
export const validateTrafficFines = (fines: TrafficFineValidationSchema[]): { 
  allValid: boolean; 
  results: TrafficFineValidationResult[];
  errorCount: number;
} => {
  const results = fines.map(fine => validateTrafficFine(fine));
  const errorCount = results.filter(result => !result.isValid).length;
  
  return {
    allValid: errorCount === 0,
    results,
    errorCount
  };
};

/**
 * Identifies and returns traffic fines with missing license plates
 * @param fines Array of traffic fines to check
 * @returns Array of traffic fines without license plates
 */
export const identifyFinesWithoutLicensePlates = (fines: TrafficFineValidationSchema[]): TrafficFineValidationSchema[] => {
  return fines.filter(fine => !fine.licensePlate || isEmptyString(fine.licensePlate));
};

/**
 * Checks if a traffic fine has all required fields
 * @param fine The traffic fine to check
 * @returns Boolean indicating if all required fields are present
 */
export const hasRequiredFields = (fine: TrafficFineValidationSchema): boolean => {
  return Boolean(
    fine.licensePlate && 
    fine.violationDate && 
    fine.fineAmount !== undefined && 
    fine.fineAmount !== null
  );
};
