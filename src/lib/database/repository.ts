
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Tables, DbListResponse, DbSingleResponse } from './types'
import { Database } from '@/types/database.types'

/**
 * Base Repository class for database operations
 */
export class Repository<T extends keyof Tables> {
  protected client: SupabaseClient<Database>
  protected tableName: T

  constructor(client: SupabaseClient<Database>, tableName: T) {
    this.client = client
    this.tableName = tableName
  }

  /**
   * Find all records in the table
  */
  async findAll(): Promise<DbListResponse<Tables[T]['Row']>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
      return { data, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Find a record by ID
  */
  async findById(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Create a new record
  */
  async create(data: Tables[T]['Insert']): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert([data])
        .select()
        .single()
      return { data: result, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Update a record
  */
  async update(id: string, data: Tables[T]['Update']): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      return { data: result, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Delete a record
  */
  async delete(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Find records by a field value
  */
  async findByField(field: keyof Tables[T]['Row'], value: any): Promise<DbListResponse<Tables[T]['Row']>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq(field as string, value)
      return { data, error }
    } catch (err) {
      return { data: null, error: err as PostgrestError }
    }
  }

  /**
   * Count records in the table
  */
  async count(): Promise<number> {
    try {
      const { count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
      return count || 0
    } catch {
      return 0
    }
  }
}

export function createRepository<T extends keyof Tables>(
  tableName: T,
  client: SupabaseClient<Database> = supabase
): Repository<T> {
  return new Repository<T>(client, tableName)
}

