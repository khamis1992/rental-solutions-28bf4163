
/**
 * Utility functions for enhanced search capabilities
 */

/**
 * Sanitizes a search query by trimming whitespace, removing special characters
 * and converting to lowercase
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  // Remove special characters but keep alphanumeric and hyphen
  return query.trim().toLowerCase().replace(/[^\w-]/g, '');
};

/**
 * Extracts numeric parts from a string
 * Useful for license plate or ID searching
 */
export const extractNumericParts = (text: string): string => {
  if (!text) return '';
  return text.replace(/\D/g, '');
};

/**
 * Normalizes a license plate by removing spaces, special characters, and converting to uppercase
 * This makes license plate comparisons more reliable
 * 
 * @param licensePlate The license plate to normalize
 * @returns Normalized license plate string
 */
export const normalizeLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  // Remove all non-alphanumeric characters and convert to uppercase
  const normalized = licensePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Additional normalization to handle common substitutions
  return normalized
    .replace(/[0O]/g, '0')  // Convert both 'O' and '0' to '0'
    .replace(/[1I]/g, '1')  // Convert both 'I' and '1' to '1'
    .replace(/[5S]/g, '5')  // Convert both 'S' and '5' to '5'
    .replace(/[8B]/g, '8'); // Convert both 'B' and '8' to '8'
};

/**
 * Normalizes an agreement number for searching
 * Makes agreement number searches more reliable by removing spaces and standardizing format
 */
export const normalizeAgreementNumber = (agreementNumber: string): string => {
  if (!agreementNumber) return '';
  
  // Remove spaces and special characters, keep letters and numbers
  return agreementNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};

/**
 * Performs fuzzy matching between two license plates
 * @param plate1 First license plate to compare
 * @param plate2 Second license plate to compare
 * @returns Similarity score between 0 and 1
 */
export const getLicensePlateSimilarity = (plate1: string, plate2: string): number => {
  if (!plate1 || !plate2) return 0;
  
  const normalized1 = normalizeLicensePlate(plate1);
  const normalized2 = normalizeLicensePlate(plate2);
  
  if (normalized1 === normalized2) return 1;
  
  // Handle exact match with different format
  if (normalized1.length === normalized2.length) {
    let matchingChars = 0;
    for (let i = 0; i < normalized1.length; i++) {
      if (normalized1[i] === normalized2[i]) matchingChars++;
    }
    return matchingChars / normalized1.length;
  }
  
  // Handle one being substring of the other
  if (normalized1.includes(normalized2)) {
    return normalized2.length / normalized1.length;
  }
  
  if (normalized2.includes(normalized1)) {
    return normalized1.length / normalized2.length;
  }
  
  // Handle more complex cases - check common characters
  const common = [...normalized1].filter(char => normalized2.includes(char)).length;
  return common / Math.max(normalized1.length, normalized2.length);
};

/**
 * Checks if a license plate matches a search query using multiple strategies
 * @param licensePlate The actual license plate
 * @param searchQuery The user's search term
 * @returns boolean indicating if there's a match
 */
export const doesLicensePlateMatch = (
  licensePlate: string | undefined | null,
  searchQuery: string
): boolean => {
  if (!licensePlate || !searchQuery) return false;
  
  // Normalize both the license plate and query for comparison
  const normalizedPlate = normalizeLicensePlate(licensePlate);
  const normalizedQuery = normalizeLicensePlate(searchQuery);
  
  // Direct match (normalized)
  if (normalizedPlate === normalizedQuery) return true;
  
  // Contains match (normalized)
  if (normalizedPlate.includes(normalizedQuery)) return true;
  
  // For numeric searches, check if the plate's numeric part matches
  if (/^\d+$/.test(normalizedQuery)) {
    const plateNumbers = extractNumericParts(licensePlate);
    
    // Exact numeric match
    if (plateNumbers === normalizedQuery) return true;
    
    // Ends with the numeric query (common search pattern)
    if (plateNumbers.endsWith(normalizedQuery)) return true;
    
    // Contains the numeric query
    if (plateNumbers.includes(normalizedQuery)) return true;
  }
  
  // For partial plate searches (at least 2 characters)
  if (normalizedQuery.length >= 2) {
    // Check if the license plate starts with the query
    if (normalizedPlate.startsWith(normalizedQuery)) return true;
    
    // Check if any part of the license plate matches the query (allow for partial plate search)
    for (let i = 0; i <= normalizedPlate.length - normalizedQuery.length; i++) {
      if (normalizedPlate.substring(i, i + normalizedQuery.length) === normalizedQuery) {
        return true;
      }
    }
    
    // Calculate similarity score for fuzzy matching
    const similarity = getLicensePlateSimilarity(normalizedPlate, normalizedQuery);
    if (similarity > 0.7) return true; // 70% similarity threshold
  }
  
  return false;
};

/**
 * Checks if a string might be an agreement number based on patterns
 * @param query The string to check
 * @returns boolean indicating if the string matches agreement number patterns
 */
export const isAgreementNumberPattern = (query: string): boolean => {
  if (!query || query.length < 3) return false;
  
  // Common agreement number patterns include:
  // - Often starts with letters followed by numbers (e.g., LTO2024313)
  // - May contain special characters or spaces
  
  // Check if it starts with 2-3 letters followed by numbers
  return /^[A-Za-z]{2,3}\d+/.test(query.replace(/[^A-Za-z0-9]/g, ''));
};

/**
 * Checks if a string might be a license plate based on patterns
 * @param query The string to check
 * @returns boolean indicating if the string matches license plate patterns
 */
export const isLicensePlatePattern = (query: string): boolean => {
  if (!query || query.length < 2) return false;
  
  // Common license plate patterns include:
  // - Mix of letters and numbers
  // - Often 5-8 characters
  // - May contain hyphens
  
  const normalized = query.replace(/[^A-Za-z0-9]/g, '');
  
  // If it has both letters and numbers, it's likely a plate
  const hasLetters = /[A-Za-z]/.test(normalized);
  const hasNumbers = /[0-9]/.test(normalized);
  
  return hasLetters && hasNumbers;
};

/**
 * Search strategy to break down a combined query into potential parts
 * This helps with queries that might be partial agreement numbers, 
 * license plates, etc.
 */
export const getSearchStrategies = (query: string): string[] => {
  const strategies: string[] = [query]; // Always include original query
  
  if (query.length >= 4) {
    // Add first half, second half
    strategies.push(query.substring(0, Math.floor(query.length / 2)));
    strategies.push(query.substring(Math.floor(query.length / 2)));
    
    // For numeric queries, add last 3-4 digits as a strategy
    if (/^\d+$/.test(query) && query.length >= 4) {
      strategies.push(query.substring(query.length - 4));
      strategies.push(query.substring(query.length - 3));
    }
    
    // For potential agreement numbers, extract number part
    if (isAgreementNumberPattern(query)) {
      const numberPart = query.replace(/[^0-9]/g, '');
      if (numberPart.length > 0) {
        strategies.push(numberPart);
      }
    }
  }
  
  return strategies.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
};
