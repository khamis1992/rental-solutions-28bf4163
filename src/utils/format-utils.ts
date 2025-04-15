
/**
 * Standardizes license plate format for consistent matching across the system
 * Removes spaces, dashes, and converts to uppercase
 * 
 * @param licensePlate The license plate to format
 * @returns Standardized license plate string
 */
export function formatLicensePlate(licensePlate: string | undefined | null): string {
  if (!licensePlate) return '';
  
  // Convert to string if not already
  const plate = String(licensePlate);
  
  // Remove spaces, dashes, and convert to uppercase
  return plate.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validates if the provided string is a valid license plate format
 * 
 * @param licensePlate The license plate to validate
 * @returns Boolean indicating if the license plate is valid
 */
export function isValidLicensePlate(licensePlate: string | undefined | null): boolean {
  if (!licensePlate) return false;
  
  const standardizedPlate = formatLicensePlate(licensePlate);
  
  // Basic validation - license plate should be at least 2 characters
  // and not contain special characters other than hyphen or space
  // This can be customized based on specific license plate format requirements
  return standardizedPlate.length >= 2 && /^[A-Z0-9]+$/.test(standardizedPlate);
}

/**
 * Formats currency values for display
 * 
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}
