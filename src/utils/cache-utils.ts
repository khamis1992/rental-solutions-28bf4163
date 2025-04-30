/**
 * Caches a value in both memory and session storage
 * @param functionName - The name/key to use for caching
 * @param available - Whether the function is available
 * @param timestamp - Timestamp of the check
 */
export function cacheAvailability(
  functionName: string,
  available: boolean,
  timestamp: number
) {
  const cacheValue = { available, timestamp };
  
  // Cache in memory
  availabilityCache[functionName] = cacheValue;
  
  // Cache in session storage if available
  if (typeof sessionStorage !== 'undefined') {
    const sessionCacheKey = `edge_function_available_${functionName}`;
    sessionStorage.setItem(sessionCacheKey, JSON.stringify(cacheValue));
  }
}

// Global memory cache
declare const availabilityCache: Record<string, { available: boolean; timestamp: number }>;
