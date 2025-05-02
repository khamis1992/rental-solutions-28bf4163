
import { ValidationResult, ValidationBatchResults, delay } from './core.ts';
import { developmentTrafficFineValidation } from './development.ts';
import { productionTrafficFineValidation } from './production.ts';

/**
 * Main validation function that delegates to the appropriate implementation
 * based on the environment
 */
export async function validateTrafficFine(licensePlate: string): Promise<ValidationResult> {
  // Check for dev mode flag to determine which implementation to use
  const isDev = Deno.env.get("DEVELOPMENT_MODE") === "true";
  
  console.log(`Traffic fine validation request for ${licensePlate} in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
  
  // Call the appropriate implementation based on the environment
  return isDev 
    ? await developmentTrafficFineValidation(licensePlate)
    : await productionTrafficFineValidation(licensePlate);
}

/**
 * Batch validation of multiple license plates
 */
export async function validateTrafficFinesBatch(
  licensePlates: string[],
  maxPlates: number = 10
): Promise<ValidationBatchResults> {
  // Limit to maximum number of plates
  const platesToProcess = licensePlates.slice(0, maxPlates);
  
  if (platesToProcess.length === 0) {
    throw new Error('No valid license plates provided');
  }
  
  // Process each license plate
  const results: ValidationResult[] = [];
  const errors: Array<{ licensePlate: string; error: string }> = [];
  
  for (const plate of platesToProcess) {
    try {
      // Validate this plate
      const result = await validateTrafficFine(plate);
      results.push(result);
      
      // Add a delay between requests
      await delay(500);
    } catch (error) {
      console.error(`Error validating ${plate}:`, error);
      errors.push({ 
        licensePlate: plate, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return {
    results,
    errors,
    summary: {
      total: platesToProcess.length,
      succeeded: results.length,
      failed: errors.length,
      environment: Deno.env.get("DEVELOPMENT_MODE") === "true" ? "development" : "production"
    }
  };
}
