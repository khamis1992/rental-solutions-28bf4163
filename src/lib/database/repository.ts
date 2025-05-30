import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { Result, createSuccessResult, createErrorResult } from '@/lib/errors/types';
import { toAppError } from '@/lib/errors/error-handler';
import { SupabaseClient } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

export class GenericRepository<T extends TableName> {
  constructor(
    private tableName: T,
    private client: SupabaseClient = supabase
  ) {}

  async findById(id: string): Promise<Result<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error finding ${this.tableName} by id:`, error);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      if (!response.data) {
        const error = toAppError(new Error(`${this.tableName} not found`));
        console.warn(error.message);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      return createSuccessResult(response.data);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error finding ${this.tableName}:`, appError);
      return createErrorResult<Tables[T]['Row']>(appError);
    }
  }

  async findAll(): Promise<Result<Tables[T]['Row'][]>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .select('*');

      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error finding all ${this.tableName}:`, error);
        return createErrorResult<Tables[T]['Row'][]>(error);
      }

      return createSuccessResult(response.data || []);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error finding all ${this.tableName}:`, appError);
      return createErrorResult<Tables[T]['Row'][]>(appError);
    }
  }

  async create(data: Tables[T]['Insert']): Promise<Result<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error creating ${this.tableName}:`, error);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      if (!response.data) {
        const error = toAppError(new Error(`Failed to create ${this.tableName}`));
        console.warn(error.message);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      return createSuccessResult(response.data);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error creating ${this.tableName}:`, appError);
      return createErrorResult<Tables[T]['Row']>(appError);
    }
  }

  async update(id: string, data: Tables[T]['Update']): Promise<Result<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error updating ${this.tableName}:`, error);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      if (!response.data) {
        const error = toAppError(new Error(`${this.tableName} not found`));
        console.warn(error.message);
        return createErrorResult<Tables[T]['Row']>(error);
      }

      return createSuccessResult(response.data);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error updating ${this.tableName}:`, appError);
      return createErrorResult<Tables[T]['Row']>(appError);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error deleting ${this.tableName}:`, error);
        return createErrorResult<void>(error);
      }

      return createSuccessResult(undefined);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error deleting ${this.tableName}:`, appError);
      return createErrorResult<void>(appError);
    }
  }

  async findByField(field: string, value: any): Promise<{ data: Tables[T]['Row'][] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from(String(this.tableName))
        .select('*')
        .eq(field, value);
      
      return { data, error };
    } catch (error) {
      console.error(`Error finding ${String(this.tableName)} by ${field}:`, error);
      return { data: null, error };
    }
  }

  async count(): Promise<{ data: number | null; error: any }> {
    try {
      const { count, error } = await this.client
        .from(String(this.tableName))
        .select('*', { count: 'exact', head: true });
      
      return { data: count, error };
    } catch (error) {
      console.error(`Error counting ${String(this.tableName)}:`, error);
      return { data: null, error };
    }
  }
}

// Factory function to create typed repositories
export function createRepository<T extends TableName>(tableName: T, client = supabase) {
  return new GenericRepository(tableName, client);
}

// Pre-created repositories for common tables
export const leases = createRepository('leases');
export const profiles = createRepository('profiles');
export const vehicles = createRepository('vehicles');
export const unifiedPayments = createRepository('unified_payments');
export const paymentSchedules = createRepository('payment_schedules');
