/**
 * Edge Function Error Handler
 * Provides safe error handling for Supabase Edge Function calls
 */

export interface EdgeFunctionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isUnavailable?: boolean;
}

/**
 * Safe wrapper for Supabase Edge Function calls
 */
export async function safeEdgeFunctionCall<T = any>(
  functionName: string,
  body: any,
  options: {
    timeout?: number;
    fallbackData?: T;
    suppressErrors?: boolean;
  } = {}
): Promise<EdgeFunctionResult<T>> {
  const { timeout = 8000, fallbackData, suppressErrors = false } = options;

  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Edge Function ${functionName} timeout`)), timeout)
    );

    // Create function call promise
    const functionPromise = supabase.functions.invoke(functionName, { body });

    // Race between function call and timeout
    const result = await Promise.race([functionPromise, timeoutPromise]);

    if (result.error) {
      if (!suppressErrors) {
        console.warn(`Edge Function ${functionName} error:`, result.error);
      }
      
      return {
        success: false,
        error: result.error.message || 'Edge Function error',
        isUnavailable: true,
        data: fallbackData
      };
    }

    return {
      success: true,
      data: result.data || fallbackData
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (!suppressErrors) {
      console.warn(`Edge Function ${functionName} failed:`, errorMessage);
    }

    // Check if it's a network/connection error
    const isUnavailable = errorMessage.includes('timeout') || 
                         errorMessage.includes('fetch') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('FunctionsFetchError');

    return {
      success: false,
      error: errorMessage,
      isUnavailable,
      data: fallbackData
    };
  }
}

/**
 * Test if Edge Functions are available
 */
export async function testEdgeFunctionAvailability(): Promise<{
  googleVision: boolean;
  openAI: boolean;
  overall: boolean;
}> {
  const [visionResult, openAIResult] = await Promise.allSettled([
    safeEdgeFunctionCall('process-google-vision', { test: true }, { 
      timeout: 5000, 
      suppressErrors: true 
    }),
    safeEdgeFunctionCall('process-openai', { test: true }, { 
      timeout: 5000, 
      suppressErrors: true 
    })
  ]);

  const googleVision = visionResult.status === 'fulfilled' && visionResult.value.success;
  const openAI = openAIResult.status === 'fulfilled' && openAIResult.value.success;

  return {
    googleVision,
    openAI,
    overall: googleVision || openAI
  };
}

/**
 * Initialize edge function availability check on app startup
 */
export async function initializeEdgeFunctionChecks(): Promise<void> {
  try {
    const availability = await testEdgeFunctionAvailability();
    
    // Store in session storage for quick access
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('edge_functions_availability', JSON.stringify({
        ...availability,
        timestamp: Date.now()
      }));
    }

    console.log('Edge Functions availability check completed:', availability);
  } catch (error) {
    console.warn('Edge Functions availability check failed:', error);
  }
} 