
import { supabase } from '@/lib/supabase';

// Cache for storing availability check results
const availabilityCache: Record<string, { available: boolean; timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if a Supabase Edge Function is available
 * @param functionName Name of the edge function to check
 * @param retries Number of retry attempts in case of failure
 * @returns Promise resolving to boolean indicating if function is available
 */
export const checkEdgeFunctionAvailability = async (
  functionName: string,
  retries = 1
): Promise<boolean> => {
  // Check cache first to avoid repeated calls
  const cachedResult = availabilityCache[functionName];
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    console.log(`Using cached availability result for ${functionName}: ${cachedResult.available}`);
    return cachedResult.available;
  }
  
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      console.log(`Checking edge function availability: ${functionName} (attempt ${attempt + 1}/${retries + 1})`);
      
      const response = await supabase.functions.invoke(functionName, {
        body: { test: true },
      });
      
      if (!response.error) {
        console.log(`Edge function ${functionName} is available`);
        // Cache the positive result
        availabilityCache[functionName] = { available: true, timestamp: now };
        return true;
      }
      
      console.warn(`Edge function ${functionName} check failed:`, response.error);
      attempt++;
      
      if (attempt <= retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (err) {
      console.error(`Error checking edge function ${functionName}:`, err);
      attempt++;
      
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  console.error(`Edge function ${functionName} is unavailable after ${retries + 1} attempts`);
  // Cache the negative result
  availabilityCache[functionName] = { available: false, timestamp: now };
  return false;
};

/**
 * Get the status of essential system services
 * @returns Promise resolving to object with service status
 */
export const getSystemServicesStatus = async (): Promise<{
  agreementImport: boolean;
  customerImport: boolean;
}> => {
  const agreementImport = await checkEdgeFunctionAvailability('process-agreement-imports');
  const customerImport = await checkEdgeFunctionAvailability('process-customer-imports', 2);
  
  return {
    agreementImport,
    customerImport
  };
};
