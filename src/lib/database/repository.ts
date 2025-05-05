
/**
 * Base repository interface for database operations
 */

import { GenericSchema, SupabaseClient } from '@supabase/supabase-js';
import { DbListResponse, DbSingleResponse } from './types';

export interface Repository<T, CreateT, UpdateT> {
  getById(id: string): Promise<DbSingleResponse<T>>;
  getAll(options?: any): Promise<DbListResponse<T>>;
  create(data: CreateT): Promise<DbSingleResponse<T>>;
  update(id: string, data: UpdateT): Promise<DbSingleResponse<T>>;
  delete(id: string): Promise<DbSingleResponse<T>>;
}

export class BaseRepository<T, CreateT = Partial<T>, UpdateT = Partial<T>> implements Repository<T, CreateT, UpdateT> {
  protected client: SupabaseClient;
  protected table: string;

  constructor(client: SupabaseClient, table: string) {
    this.client = client;
    this.table = table;
  }

  async getById(id: string): Promise<DbSingleResponse<T>> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();
      
    return { data: data as T, error };
  }

  async getAll(options?: any): Promise<DbListResponse<T>> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*');
      
    return { data: data as T[], error };
  }

  async create(data: CreateT): Promise<DbSingleResponse<T>> {
    const { data: created, error } = await this.client
      .from(this.table)
      .insert(data as any)
      .select()
      .single();
      
    return { data: created as T, error };
  }

  async update(id: string, data: UpdateT): Promise<DbSingleResponse<T>> {
    const { data: updated, error } = await this.client
      .from(this.table)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
      
    return { data: updated as T, error };
  }

  async delete(id: string): Promise<DbSingleResponse<T>> {
    const { data: deleted, error } = await this.client
      .from(this.table)
      .delete()
      .eq('id', id)
      .select()
      .single();
      
    return { data: deleted as T, error };
  }
}
