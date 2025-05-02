
/**
 * Normalizes a license plate string by removing spaces, special characters, 
 * and converting to uppercase for consistent matching
 * 
 * @param licensePlate License plate to normalize
 * @returns Normalized license plate string
 */
export const normalizeLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  // Remove spaces, dashes, dots, and other special characters
  // Convert to uppercase for case-insensitive matching
  return licensePlate
    .trim()
    .replace(/[\s\-\.\/\\]/g, '')
    .toUpperCase();
};

/**
 * Fuzzy matches two license plates by normalizing both strings first
 * 
 * @param plate1 First license plate
 * @param plate2 Second license plate
 * @returns True if the normalized plates match
 */
export const fuzzyMatchLicensePlates = (plate1: string, plate2: string): boolean => {
  if (!plate1 || !plate2) return false;
  
  const normalized1 = normalizeLicensePlate(plate1);
  const normalized2 = normalizeLicensePlate(plate2);
  
  return normalized1 === normalized2;
};
