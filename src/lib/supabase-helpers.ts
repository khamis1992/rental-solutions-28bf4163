import { Database } from '@/types/database.types';
import { DbTables, TableRow, TableInsert, TableUpdate, LeaseId, ProfileId, VehicleId, PaymentId } from './database-types';

// Helper type for UUID strings
export type UUID = string;

// Table names type
export type TableName = keyof DbTables;

// Generic CRUD operations helper
export class SupabaseTableHelper<T extends TableName> {
  constructor(
    private tableName: T,
    private supabaseClient: any
  ) {}

  async findAll(): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.tableName))
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<TableRow<T> | null> {
    const { data, error } = await this.supabaseClient
      .from(String(this.tableName))
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(data: TableInsert<T>): Promise<TableRow<T>> {
    const { data: result, error } = await this.supabaseClient
      .from(String(this.tableName))
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async update(id: string, data: TableUpdate<T>): Promise<TableRow<T>> {
    const { data: result, error } = await this.supabaseClient
      .from(String(this.tableName))
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(String(this.tableName))
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async findByField(field: string, value: any): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.tableName))
      .select('*')
      .eq(field, value);
    
    if (error) throw error;
    return data || [];
  }

  async updateByField(field: string, value: any, updateData: TableUpdate<T>): Promise<TableRow<T>[]> {
    const { data, error } = await this.supabaseClient
      .from(String(this.tableName))
      .update(updateData)
      .eq(field, value)
      .select();
    
    if (error) throw error;
    return data || [];
  }
}

// Create typed helpers for specific tables
export const createLeaseHelper = (supabaseClient: any) => 
  new SupabaseTableHelper('leases', supabaseClient);

export const createProfileHelper = (supabaseClient: any) => 
  new SupabaseTableHelper('profiles', supabaseClient);

export const createVehicleHelper = (supabaseClient: any) => 
  new SupabaseTableHelper('vehicles', supabaseClient);

export const createPaymentHelper = (supabaseClient: any) => 
  new SupabaseTableHelper('unified_payments', supabaseClient);
