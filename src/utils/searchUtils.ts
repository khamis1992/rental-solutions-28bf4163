
/**
 * Utility functions for search operations
 */

/**
 * Normalizes a license plate by removing spaces, dashes, and converting to uppercase
 * This ensures consistent matching regardless of formatting differences
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return '';
  
  // Remove spaces, dashes and convert to uppercase
  return plate.replace(/[\s\-\.]/g, '').toUpperCase();
}

/**
 * Performs a fuzzy match between two license plates
 * Returns true if they are similar enough (normalized match)
 */
export function fuzzyMatchLicensePlates(plate1: string, plate2: string): boolean {
  const normalized1 = normalizeLicensePlate(plate1);
  const normalized2 = normalizeLicensePlate(plate2);
  
  return normalized1 === normalized2;
}

/**
 * Normalizes a search term by removing excess whitespace and lowercasing
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return term.trim().toLowerCase();
}

/**
 * Performs a simple fuzzy search on a collection of items
 */
export function fuzzySearch<T>(
  items: T[], 
  searchTerm: string, 
  fields: (keyof T)[]
): T[] {
  const normalizedTerm = normalizeSearchTerm(searchTerm);
  
  if (!normalizedTerm) return items;
  
  return items.filter(item => {
    return fields.some(field => {
      const value = String(item[field] || '').toLowerCase();
      return value.includes(normalizedTerm);
    });
  });
}
