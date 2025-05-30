
import { supabase } from '@/lib/supabase';
import { DbTables, DbTableName } from './types';

export class GenericRepository<T extends DbTableName> {
  constructor(
    private tableName: T,
    private client: any = supabase
  ) {}

  async findAll(): Promise<{ data: DbTables[T]['Row'][] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from(String(this.tableName))
        .select('*');
      
      return { data, error };
    } catch (error) {
      console.error(`Error fetching all ${String(this.tableName)}:`, error);
      return { data: null, error };
    }
  }

  async findById(id: string): Promise<{ data: DbTables[T]['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from(String(this.tableName))
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error(`Error fetching ${String(this.tableName)} by ID:`, error);
      return { data: null, error };
    }
  }

  async create(data: DbTables[T]['Insert']): Promise<{ data: DbTables[T]['Row'] | null; error: any }> {
    try {
      const { data: result, error } = await this.client
        .from(String(this.tableName))
        .insert([data])
        .select()
        .single();
      
      return { data: result, error };
    } catch (error) {
      console.error(`Error creating ${String(this.tableName)}:`, error);
      return { data: null, error };
    }
  }

  async update(id: string, updates: DbTables[T]['Update']): Promise<{ data: DbTables[T]['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from(String(this.tableName))
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error(`Error updating ${String(this.tableName)}:`, error);
      return { data: null, error };
    }
  }

  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.client
        .from(String(this.tableName))
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error(`Error deleting ${String(this.tableName)}:`, error);
      return { error };
    }
  }

  async findByField(field: string, value: any): Promise<{ data: DbTables[T]['Row'][] | null; error: any }> {
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
export function createRepository<T extends DbTableName>(tableName: T, client = supabase) {
  return new GenericRepository(tableName, client);
}

// Pre-created repositories for common tables
export const leases = createRepository('leases');
export const profiles = createRepository('profiles');
export const vehicles = createRepository('vehicles');
export const unifiedPayments = createRepository('unified_payments');
export const paymentSchedules = createRepository('payment_schedules');
