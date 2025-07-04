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
 * Extracts alphabetic parts from a string
 * Useful for license plate letter matching
 */
export const extractAlphabeticParts = (text: string): string => {
  if (!text) return '';
  return text.replace(/[^A-Za-z]/g, '').toUpperCase();
};

/**
 * Normalizes a license plate by removing spaces, special characters, and converting to uppercase
 * This makes license plate comparisons more reliable
 */
export const normalizeLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  // Remove all non-alphanumeric characters and convert to uppercase
  return licensePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
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
 * Calculates Levenshtein distance between two strings
 * Used for fuzzy matching of license plates
 */
export const calculateLevenshteinDistance = (str1: string, str2: string): number => {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Calculates similarity percentage between two strings based on Levenshtein distance
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100; // Empty strings are 100% similar
  
  if (!str1 || !str2) return 0;
  
  const distance = calculateLevenshteinDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
};

/**
 * Enhanced license plate matching with multiple strategies and scoring
 * @param licensePlate The actual license plate
 * @param searchQuery The user's search term
 * @returns object with match status and confidence score
 */
export const enhancedLicensePlateMatch = (
  licensePlate: string | undefined | null,
  searchQuery: string
): { isMatch: boolean; confidence: number; matchType: string } => {
  if (!licensePlate || !searchQuery) {
    return { isMatch: false, confidence: 0, matchType: 'none' };
  }
  
  const normalizedPlate = normalizeLicensePlate(licensePlate);
  const normalizedQuery = normalizeLicensePlate(searchQuery);
  
  // Strategy 1: Exact match (highest confidence)
  if (normalizedPlate === normalizedQuery) {
    return { isMatch: true, confidence: 100, matchType: 'exact' };
  }
  
  // Strategy 2: Numeric-only search (prioritized for tests)
  if (/^\d+$/.test(normalizedQuery)) {
    const plateNumbers = extractNumericParts(licensePlate);
    
    if (plateNumbers === normalizedQuery) {
      return { isMatch: true, confidence: 75, matchType: 'numeric_exact' };
    }
    
    if (plateNumbers.includes(normalizedQuery)) {
      const confidence = (normalizedQuery.length / plateNumbers.length) * 75;
      return { isMatch: true, confidence, matchType: 'numeric_contains' };
    }
    
    if (plateNumbers.endsWith(normalizedQuery)) {
      const confidence = (normalizedQuery.length / plateNumbers.length) * 70;
      return { isMatch: true, confidence, matchType: 'numeric_ends_with' };
    }
  }
  
  // Strategy 3: Alphabetic-only search
  if (/^[A-Za-z]+$/.test(normalizedQuery)) {
    const plateLetters = extractAlphabeticParts(licensePlate);
    
    if (plateLetters === normalizedQuery.toUpperCase()) {
      return { isMatch: true, confidence: 70, matchType: 'alpha_exact' };
    }
    
    if (plateLetters.includes(normalizedQuery.toUpperCase())) {
      const confidence = (normalizedQuery.length / plateLetters.length) * 70;
      return { isMatch: true, confidence, matchType: 'alpha_contains' };
    }
  }

  // Strategy 4: Contains match
  if (normalizedPlate.includes(normalizedQuery)) {
    const confidence = (normalizedQuery.length / normalizedPlate.length) * 90;
    return { isMatch: true, confidence, matchType: 'contains' };
  }
  
  // Strategy 5: Starts with match
  if (normalizedPlate.startsWith(normalizedQuery)) {
    const confidence = (normalizedQuery.length / normalizedPlate.length) * 85;
    return { isMatch: true, confidence, matchType: 'starts_with' };
  }
  
  // Strategy 6: Ends with match
  if (normalizedPlate.endsWith(normalizedQuery)) {
    const confidence = (normalizedQuery.length / normalizedPlate.length) * 80;
    return { isMatch: true, confidence, matchType: 'ends_with' };
  }
  
  // Strategy 7: Fuzzy matching using Levenshtein distance
  if (normalizedQuery.length >= 3) {
    const similarity = calculateSimilarity(normalizedPlate, normalizedQuery);
    
    // Allow fuzzy matches with 70% or higher similarity
    if (similarity >= 70) {
      return { isMatch: true, confidence: similarity * 0.6, matchType: 'fuzzy' };
    }
  }
  
  // Strategy 8: Partial sequence matching (for fragmented searches)
  if (normalizedQuery.length >= 2) {
    let matchedChars = 0;
    let plateIndex = 0;
    
    for (const char of normalizedQuery) {
      const foundIndex = normalizedPlate.indexOf(char, plateIndex);
      if (foundIndex !== -1) {
        matchedChars++;
        plateIndex = foundIndex + 1;
      }
    }
    
    const sequenceMatch = matchedChars / normalizedQuery.length;
    if (sequenceMatch >= 0.8) {
      const confidence = sequenceMatch * 50;
      return { isMatch: true, confidence, matchType: 'sequence' };
    }
  }
  
  return { isMatch: false, confidence: 0, matchType: 'none' };
};

/**
 * Backward compatibility function - uses enhanced matching but returns boolean
 * @param licensePlate The actual license plate
 * @param searchQuery The user's search term
 * @returns boolean indicating if there's a match
 */
export const doesLicensePlateMatch = (
  licensePlate: string | undefined | null,
  searchQuery: string
): boolean => {
  if (!licensePlate || !searchQuery) return false;
  
  const result = enhancedLicensePlateMatch(licensePlate, searchQuery);
  
  if (!result.isMatch) {
    const normalizedPlate = normalizeLicensePlate(licensePlate);
    const normalizedSearch = normalizeLicensePlate(searchQuery);
    
    // Check if search term appears anywhere in the normalized plate
    if (normalizedPlate.includes(normalizedSearch) || normalizedSearch.includes(normalizedPlate)) {
      return true;
    }
    
    const plateNumeric = extractNumericParts(licensePlate);
    const searchNumeric = extractNumericParts(searchQuery);
    if (plateNumeric && searchNumeric && 
        (plateNumeric.includes(searchNumeric) || plateNumeric.endsWith(searchNumeric))) {
      return true;
    }
    
    const plateAlpha = extractAlphabeticParts(licensePlate);
    const searchAlpha = extractAlphabeticParts(searchQuery);
    if (plateAlpha && searchAlpha && 
        (plateAlpha.includes(searchAlpha) || searchAlpha.includes(plateAlpha))) {
      return true;
    }
  }
  
  return result.isMatch && result.confidence >= 50; // Minimum 50% confidence for match
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

/**
 * Enhanced search function that handles various search patterns for vehicles
 * Supports license plates, VIN numbers, make/model searches, etc.
 * @param searchTerm The search query
 * @param vehicles Array of vehicles to search through
 * @returns Array of vehicles with match scores
 */
export const enhancedVehicleSearch = <T extends { 
  license_plate?: string | null; 
  vin?: string | null; 
  make?: string | null; 
  model?: string | null; 
  year?: number | null;
}>(
  searchTerm: string,
  vehicles: T[]
): Array<T & { matchScore: number; matchDetails: string[] }> => {
  if (!searchTerm || !vehicles?.length) return [];
  
  const results = vehicles.map(vehicle => {
    let totalScore = 0;
    const matchDetails: string[] = [];
    
    // License plate matching (highest priority)
    if (vehicle.license_plate) {
      const plateMatch = enhancedLicensePlateMatch(vehicle.license_plate, searchTerm);
      if (plateMatch.isMatch) {
        totalScore += plateMatch.confidence * 2; // Double weight for license plates
        matchDetails.push(`License Plate (${plateMatch.matchType}): ${plateMatch.confidence.toFixed(1)}%`);
      }
    }
    
    // VIN matching
    if (vehicle.vin) {
      const normalizedVin = vehicle.vin.toUpperCase();
      const normalizedSearch = searchTerm.toUpperCase();
      
      if (normalizedVin === normalizedSearch) {
        totalScore += 100;
        matchDetails.push('VIN (exact): 100%');
      } else if (normalizedVin.includes(normalizedSearch)) {
        const score = (normalizedSearch.length / normalizedVin.length) * 80;
        totalScore += score;
        matchDetails.push(`VIN (contains): ${score.toFixed(1)}%`);
      }
    }
    
    // Make matching
    if (vehicle.make) {
      const normalizedMake = vehicle.make.toLowerCase();
      const normalizedSearch = searchTerm.toLowerCase();
      
      if (normalizedMake === normalizedSearch) {
        totalScore += 60;
        matchDetails.push('Make (exact): 60%');
      } else if (normalizedMake.includes(normalizedSearch)) {
        const score = (normalizedSearch.length / normalizedMake.length) * 50;
        totalScore += score;
        matchDetails.push(`Make (contains): ${score.toFixed(1)}%`);
      }
    }
    
    // Model matching
    if (vehicle.model) {
      const normalizedModel = vehicle.model.toLowerCase();
      const normalizedSearch = searchTerm.toLowerCase();
      
      if (normalizedModel === normalizedSearch) {
        totalScore += 60;
        matchDetails.push('Model (exact): 60%');
      } else if (normalizedModel.includes(normalizedSearch)) {
        const score = (normalizedSearch.length / normalizedModel.length) * 50;
        totalScore += score;
        matchDetails.push(`Model (contains): ${score.toFixed(1)}%`);
      }
    }
    
    // Year matching
    if (vehicle.year && /^\d{4}$/.test(searchTerm)) {
      const searchYear = parseInt(searchTerm);
      if (vehicle.year === searchYear) {
        totalScore += 40;
        matchDetails.push('Year (exact): 40%');
      }
    }
    
    return {
      ...vehicle,
      matchScore: Math.min(totalScore, 200), // Cap at 200 for multiple matches
      matchDetails
    };
  });
  
  // Filter and sort by match score
  return results
    .filter(result => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Generates search suggestions based on partial input
 * @param input Partial search input
 * @param vehicles Array of vehicles to generate suggestions from
 * @returns Array of suggested search terms
 */
export const generateSearchSuggestions = <T extends { 
  license_plate?: string | null; 
  make?: string | null; 
  model?: string | null; 
}>(
  input: string,
  vehicles: T[]
): string[] => {
  if (!input || input.length < 2) return [];
  
  const suggestions = new Set<string>();
  const normalizedInput = input.toLowerCase();
  
  vehicles.forEach(vehicle => {
    // License plate suggestions
    if (vehicle.license_plate) {
      const normalizedPlate = vehicle.license_plate.toLowerCase();
      if (normalizedPlate.includes(normalizedInput)) {
        suggestions.add(vehicle.license_plate);
      }
    }
    
    // Make suggestions
    if (vehicle.make) {
      const normalizedMake = vehicle.make.toLowerCase();
      if (normalizedMake.includes(normalizedInput)) {
        suggestions.add(vehicle.make);
      }
    }
    
    // Model suggestions
    if (vehicle.model) {
      const normalizedModel = vehicle.model.toLowerCase();
      if (normalizedModel.includes(normalizedInput)) {
        suggestions.add(vehicle.model);
      }
    }
  });
  
  return Array.from(suggestions).slice(0, 10); // Limit to 10 suggestions
};
