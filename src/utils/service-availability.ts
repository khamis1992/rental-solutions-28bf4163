import { supabase } from '@/lib/supabase';
import { cacheAvailability } from './cache-utils';
import { logOperation } from '@/utils/monitoring-utils';

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
  // First check browser session storage if available
  if (typeof sessionStorage !== 'undefined') {
    const sessionCacheKey = `edge_function_available_${functionName}`;
    const cachedResult = sessionStorage.getItem(sessionCacheKey);
    
    if (cachedResult) {
      try {
        const { available, timestamp } = JSON.parse(cachedResult);
        const now = Date.now();
        
        // If still valid in cache, return immediately
        if (now - timestamp < CACHE_TTL) {
          logOperation(
            'serviceAvailability.checkEdgeFunction', 
            'success', 
            { functionName, available, source: 'sessionStorage' },
            `Using session storage cache for edge function`
          );
          return available;
        }
      } catch (err) {
        // If there's an error parsing, just continue to the next cache level
        logOperation(
          'serviceAvailability.checkEdgeFunction', 
          'warning', 
          { error: err instanceof Error ? err.message : String(err) },
          'Error parsing session storage cache'
        );
      }
    }
  }
  
  // Check memory cache second
  const cachedResult = availabilityCache[functionName];
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    logOperation(
      'serviceAvailability.checkEdgeFunction', 
      'success', 
      { functionName, available: cachedResult.available, source: 'memoryCache' },
      `Using in-memory cache for edge function`
    );
    
    // Update session storage with this value
    if (typeof sessionStorage !== 'undefined') {
      const sessionCacheKey = `edge_function_available_${functionName}`;
      sessionStorage.setItem(sessionCacheKey, JSON.stringify(cachedResult));
    }
    
    return cachedResult.available;
  }
  
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      logOperation(
        'serviceAvailability.checkEdgeFunction', 
        'success', 
        { functionName, attempt: attempt + 1, totalAttempts: retries + 1 },
        `Checking edge function availability`
      );
      
      const response = await supabase.functions.invoke(functionName, {
        body: { test: true },
      });
      
      if (!response.error) {
        logOperation(
          'serviceAvailability.checkEdgeFunction', 
          'success', 
          { functionName },
          `Edge function is available`
        );
        
        // Cache the positive result
        cacheAvailability(functionName, true, now);
        
        return true;
      }
      
      logOperation(
        'serviceAvailability.checkEdgeFunction', 
        'warning', 
        { functionName, error: response.error, attempt: attempt + 1 },
        `Edge function check failed`
      );
      attempt++;
      
      if (attempt <= retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (err) {
      logOperation(
        'serviceAvailability.checkEdgeFunction', 
        'error', 
        { functionName, error: err instanceof Error ? err.message : String(err), attempt: attempt + 1 },
        `Error checking edge function`
      );
      attempt++;
      
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  logOperation(
    'serviceAvailability.checkEdgeFunction', 
    'error', 
    { functionName, attempts: retries + 1 },
    `Edge function is unavailable after multiple attempts`
  );
  
  // Cache the negative result
  cacheAvailability(functionName, false, now);
  
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
  // Check session storage cache first
  if (typeof sessionStorage !== 'undefined') {
    const cachedServices = sessionStorage.getItem('system_services_status');
    
    if (cachedServices) {
      try {
        const { status, timestamp } = JSON.parse(cachedServices);
        const now = Date.now();
        
        // Cache valid for 1 hour
        if (now - timestamp < CACHE_TTL) {
          logOperation(
            'serviceAvailability.getSystemServicesStatus', 
            'success', 
            { source: 'sessionStorage' },
            'Using cached system services status'
          );
          return status;
        }
      } catch (err) {
        logOperation(
          'serviceAvailability.getSystemServicesStatus', 
          'warning', 
          { error: err instanceof Error ? err.message : String(err) },
          'Error parsing services cache'
        );
      }
    }
  }
  
  const agreementImport = await checkEdgeFunctionAvailability('process-agreement-imports');
  const customerImport = await checkEdgeFunctionAvailability('process-customer-imports', 2);
  
  const status = {
    agreementImport,
    customerImport
  };
  
  // Cache the result in session storage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('system_services_status', JSON.stringify({
      status,
      timestamp: Date.now()
    }));
  }
  
  return status;
};
