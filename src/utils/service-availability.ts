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
          console.log(`Using session storage cache for ${functionName}: ${available}`);
          return available;
        }
      } catch (err) {
        // If there's an error parsing, just continue to the next cache level
        console.warn('Error parsing session storage cache:', err);
      }
    }
  }
  
  // Check memory cache second
  const cachedResult = availabilityCache[functionName];
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    console.log(`Using in-memory cache for ${functionName}: ${cachedResult.available}`);
    
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
      console.log(`ℹ️ Checking edge function availability: ${functionName} (attempt ${attempt + 1}/${retries + 1})`);
      
      const response = await supabase.functions.invoke(functionName, {
        body: { test: true },
      });
      
      if (!response.error) {
        console.log(`✅ Edge function ${functionName} is available`);
        
        // Cache the positive result both in memory and session storage
        const cacheValue = { available: true, timestamp: now };
        availabilityCache[functionName] = cacheValue;
        
        if (typeof sessionStorage !== 'undefined') {
          const sessionCacheKey = `edge_function_available_${functionName}`;
          sessionStorage.setItem(sessionCacheKey, JSON.stringify(cacheValue));
        }
        
        return true;
      }
      
      // Handle specific error cases more gracefully
      if (response.error?.message?.includes('Function not found') || 
          response.error?.message?.includes('Invalid API key') ||
          response.error?.message?.includes('Not Found')) {
        console.log(`ℹ️ Edge function ${functionName} not deployed or not accessible - this is expected in development`);
        break; // No need to retry for these errors
      }
      
      console.log(`⚠️ Edge function ${functionName} check failed:`, response.error?.message || 'Unknown error');
      attempt++;
      
      if (attempt <= retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (err) {
      console.log(`ℹ️ Error checking edge function ${functionName}:`, err instanceof Error ? err.message : 'Unknown error');
      
      // Handle common development errors gracefully
      if (err instanceof Error && 
          (err.message.includes('fetch') || 
           err.message.includes('network') || 
           err.message.includes('API key'))) {
        console.log(`ℹ️ Edge function ${functionName} not accessible - continuing without this service`);
        break; // No need to retry for these errors
      }
      
      attempt++;
      
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  console.log(`ℹ️ Edge function ${functionName} is unavailable - some import features may be limited`);
  
  // Cache the negative result both in memory and session storage
  const cacheValue = { available: false, timestamp: now };
  availabilityCache[functionName] = cacheValue;
  
  if (typeof sessionStorage !== 'undefined') {
    const sessionCacheKey = `edge_function_available_${functionName}`;
    sessionStorage.setItem(sessionCacheKey, JSON.stringify(cacheValue));
  }
  
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
          console.log('ℹ️ Using cached system services status');
          return status;
        }
      } catch (err) {
        console.warn('Error parsing services cache:', err);
      }
    }
  }
  
  console.log('🔍 Checking system services availability...');
  
  // Check edge functions with reduced retries to speed up development
  const agreementImport = await checkEdgeFunctionAvailability('process-agreement-imports', 0);
  const customerImport = await checkEdgeFunctionAvailability('process-customer-imports', 0);
  
  const status = {
    agreementImport,
    customerImport
  };
  
  // Log overall status
  const availableServices = Object.values(status).filter(Boolean).length;
  const totalServices = Object.keys(status).length;
  
  if (availableServices === 0) {
    console.log('ℹ️ No edge functions available - using core features only');
  } else if (availableServices < totalServices) {
    console.log(`ℹ️ ${availableServices}/${totalServices} edge functions available - some import features may be limited`);
  } else {
    console.log('✅ All edge functions available');
  }
  
  // Cache the result in session storage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('system_services_status', JSON.stringify({
      status,
      timestamp: Date.now()
    }));
  }
  
  return status;
};
