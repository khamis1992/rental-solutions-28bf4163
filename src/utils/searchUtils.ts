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
  
  const sanitizedPlate = sanitizeSearchQuery(licensePlate);
  const sanitizedQuery = sanitizeSearchQuery(searchQuery);
  
  // Direct match (sanitized)
  if (sanitizedPlate === sanitizedQuery) return true;
  
  // Contains match (sanitized)
  if (sanitizedPlate.includes(sanitizedQuery)) return true;
  
  // For numeric searches, check if the plate's numeric part matches
  if (/^\d+$/.test(sanitizedQuery)) {
    const plateNumbers = extractNumericParts(licensePlate);
    
    // Exact numeric match
    if (plateNumbers === sanitizedQuery) return true;
    
    // Ends with the numeric query (common search pattern)
    if (plateNumbers.endsWith(sanitizedQuery)) return true;
    
    // Contains the numeric query
    if (plateNumbers.includes(sanitizedQuery)) return true;
  }
  
  return false;
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
  }
  
  return strategies.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
};
