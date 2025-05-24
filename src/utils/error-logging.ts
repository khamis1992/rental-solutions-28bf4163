import { supabase } from '../lib/supabase';

/**
 * Log an error to the error_logs table
 */
export async function logError(
  errorType: string, 
  errorMessage: string, 
  errorDetails?: any, 
  source?: string
): Promise<void> {
  try {
    await supabase
      .from('error_logs')
      .insert({
        error_type: errorType,
        error_message: errorMessage,
        error_details: errorDetails ? JSON.stringify(errorDetails) : null,
        source: source || 'client',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging failed:', error);
    console.error('Original error:', { errorType, errorMessage, errorDetails, source });
  }
}
