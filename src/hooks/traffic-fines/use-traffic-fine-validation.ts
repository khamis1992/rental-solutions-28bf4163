
import { useTrafficFinesValidation } from '../use-traffic-fines-validation';
import { ValidationResult } from '@/types/validation';

export const useTrafficFineValidation = () => {
  const { validateTrafficFine, isLoading } = useTrafficFinesValidation();
  
  const adaptedValidateTrafficFine = async (licensePlate: string): Promise<ValidationResult> => {
    try {
      const result = await validateTrafficFine(licensePlate);
      
      // Transform the validation result to match the expected interface
      return {
        licensePlate: result.licensePlate,
        isValid: !result.hasFine, // Invert logic: no fine = valid
        message: result.hasFine 
          ? `Traffic fine found for license plate ${licensePlate}` 
          : `No traffic fines found for license plate ${licensePlate}`,
        validationDate: result.validationDate,
        validationSource: result.validationSource,
        hasFine: result.hasFine,
        details: result.details
      };
    } catch (error) {
      console.error("Error in adapted validateTrafficFine:", error);
      throw error;
    }
  };
  
  return {
    validateTrafficFine: adaptedValidateTrafficFine,
    isLoading
  };
};

export type { ValidationResult };
