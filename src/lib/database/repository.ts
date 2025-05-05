
/**
 * Base repository class for database operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DbListResponse, DbSingleResponse, Tables, TableRow } from './types';

/**
 * Generic repository interface for CRUD operations
 */
export abstract class Repository<T extends keyof Tables> {
  protected client: SupabaseClient;
  protected tableName: T;

  constructor(client: SupabaseClient, tableName: T) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<DbListResponse<TableRow<T>>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*');

    return { data, error };
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<DbSingleResponse<TableRow<T>>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  /**
   * Create a new record
   */
  async create(values: Tables[T]['Insert']): Promise<DbSingleResponse<TableRow<T>>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(values)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Update a record
   */
  async update(id: string, values: Tables[T]['Update']): Promise<DbSingleResponse<TableRow<T>>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(values)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    return { error };
  }

  /**
   * Find records by a specific column value
   */
  async findBy<K extends keyof TableRow<T> & string>(
    column: K, 
    value: TableRow<T>[K]
  ): Promise<DbListResponse<TableRow<T>>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq(column, value);

    return { data, error };
  }
}
