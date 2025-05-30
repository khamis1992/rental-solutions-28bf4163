
import { PostgrestError } from '@supabase/supabase-js';

export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class BaseService {
  constructor(private supabaseClient: any) {}

  protected success<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data,
      error: null
    };
  }

  protected error<T>(error: any, message?: string): ServiceResult<T> {
    console.error('Service error:', message || 'Unknown error', error);
    return {
      success: false,
      data: null,
      error: message || error?.message || 'Unknown error'
    };
  }

  protected handleError(error: any, defaultMessage: string = 'An error occurred') {
    // Log full error for debugging
    console.error('Service operation error:', error);
    
    // Handle different error types for better error messages
    if (error instanceof PostgrestError) {
      // Handle specific postgres/supabase error codes
      if (error.code === '42P01') {
        return this.error(error, 'Database table not found');
      } else if (error.code === '42703') {
        // Column does not exist error
        return this.error(error, `Database column not found: ${error.details || error.message}`);
      } else if (error.code === '23505') {
        return this.error(error, 'Duplicate record found');
      } else {
        return this.error(error, `Database error: ${error.message}`);
      }
    } 
    
    // Handle generic error 
    else if (error instanceof Error) {
      return this.error(error, error.message);
    } 
    
    // Handle string errors
    else if (typeof error === 'string') {
      return this.error(new Error(error), error);
    }
    
    // Handle unknown errors
    return this.error(error, defaultMessage);
  }
  
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<ServiceResult<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      return this.handleError(error, errorMessage);
    }
  }
}
