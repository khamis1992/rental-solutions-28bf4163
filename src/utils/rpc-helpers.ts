
import { supabase } from '@/integrations/supabase/client';

/**
 * Type-safe wrapper for invoking RPC functions
 * @param functionName The name of the RPC function to call
 * @param params The parameters to pass to the function
 * @returns The result of the function call
 */
export const callRpcFunction = async <T>(functionName: string, params?: any): Promise<T | null> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Unexpected error calling RPC function ${functionName}:`, error);
    return null;
  }
};
