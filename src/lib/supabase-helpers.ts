import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Helper type for UUID strings
export type UUID = string;

// Table names type
export type TableName = keyof Database['public']['Tables'];

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export class BaseHelper<T extends keyof Database['public']['Tables']> {
  protected table: T;
  private supabaseClient: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>, table: T) {
    this.supabaseClient = supabaseClient;
    this.table = table;
  }

  async findAll(): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.table))
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<TableRow<T> | null> {
    const { data, error } = await this.supabaseClient
      .from(String(this.table))
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(data: TableInsert<T>): Promise<TableRow<T>> {
    const { data: result, error } = await this.supabaseClient
      .from(String(this.table))
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async update(id: string, data: TableUpdate<T>): Promise<TableRow<T>> {
    const { data: result, error } = await this.supabaseClient
      .from(String(this.table))
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(String(this.table))
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async findByField(field: string, value: unknown): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.table))
      .select('*')
      .eq(field, value);
    
    if (error) throw error;
    return data || [];
  }

  async updateByField(field: string, value: unknown, updateData: TableUpdate<T>): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.table))
      .update(updateData)
      .eq(field, value)
      .select();
    
    if (error) throw error;
    return data || [];
  }
}

// Create typed helpers for specific tables
export const createLeaseHelper = (supabaseClient: SupabaseClient<Database>) =>
  new BaseHelper(supabaseClient, 'leases');

export const createProfileHelper = (supabaseClient: SupabaseClient<Database>) =>
  new BaseHelper(supabaseClient, 'profiles');

export const createVehicleHelper = (supabaseClient: SupabaseClient<Database>) =>
  new BaseHelper(supabaseClient, 'vehicles');

export const createPaymentHelper = (supabaseClient: SupabaseClient<Database>) =>
  new BaseHelper(supabaseClient, 'unified_payments');
