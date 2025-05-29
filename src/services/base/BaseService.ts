
import { SupabaseClient } from '@supabase/supabase-js';
import { ServiceResponse } from '@/types/service.types';

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
