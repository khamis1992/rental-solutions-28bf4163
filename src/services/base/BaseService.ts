
import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ServiceResult<T> = ServiceResponse<T>;

export async function handleServiceOperation<T>(
  operation: () => Promise<T>
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Service operation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export abstract class BaseService {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data
    };
  }

  protected handleError(error: any, defaultMessage: string): ServiceResponse<never> {
    console.error(defaultMessage, error);
    return {
      success: false,
      error: error?.message || defaultMessage
    };
  }
}
