/**
 * Safe Edge Function Utility
 * Provides safe wrappers for Supabase Edge Function calls
 */

export interface SafeEdgeResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timeout?: boolean;
}

/**
 * Safely call a Supabase Edge Function with timeout and error handling
 */
export async function safeEdgeCall<T = any>(
  functionName: string,
  body: any,
  timeoutMs: number = 8000
): Promise<SafeEdgeResult<T>> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Create the function call with timeout
    const functionCall = supabase.functions.invoke(functionName, { body });
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    );

    const result = await Promise.race([functionCall, timeoutPromise]);

    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Edge function error'
      };
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      error: errorMessage,
      timeout: errorMessage === 'TIMEOUT'
    };
  }
}

/**
 * Test Edge Function availability without throwing errors
 */
export async function testEdgeFunction(functionName: string): Promise<boolean> {
  try {
    const result = await safeEdgeCall(functionName, { test: true }, 5000);
    return result.success;
  } catch {
    return false;
  }
} 