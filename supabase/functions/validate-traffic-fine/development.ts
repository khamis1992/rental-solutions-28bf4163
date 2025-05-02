
import { ValidationResult, delay } from './core.ts';

/**
 * Development version of the traffic fine validation
 * This function is completely separate from the production implementation
 * to maintain a clean separation of concerns
 */
export async function developmentTrafficFineValidation(licensePlate: string): Promise<ValidationResult> {
  console.log(`[DEV MODE] Starting simulated validation for license plate: ${licensePlate}`);
  
  // Simulate API delay
  await delay(2000);
  
  // Deterministic result based on license plate for testing
  const hasEvenDigits = licensePlate.split('')
    .filter(char => !isNaN(parseInt(char)))
    .reduce((sum, digit) => sum + parseInt(digit), 0) % 2 === 0;
    
  console.log(`[DEV MODE] Completed validation for ${licensePlate} with result: ${hasEvenDigits ? 'Fine found' : 'No fine found'}`);
  
  return {
    licensePlate,
    validationDate: new Date(),
    validationSource: 'MOI Traffic System (Development Mode)',
    hasFine: hasEvenDigits,
    details: hasEvenDigits 
      ? 'Fine found in the system according to MOI website (Development Mode)' 
      : 'No fines found for this vehicle in MOI system (Development Mode)',
    environment: 'development'
  };
}
