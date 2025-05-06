
import { Tables, DbListResponse, DbSingleResponse } from './types';

/**
 * Base Repository class for database operations
 */
export class Repository<T extends keyof Tables> {
  protected client: any;
  protected tableName: T;

  constructor(client: any, tableName: T) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Find all records in the table
   */
  async findAll(): Promise<DbListResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .select('*');
    
    return { data: response.data, error: response.error };
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Create a new record
   */
  async create(data: Tables[T]['Insert']): Promise<DbSingleResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update a record
   */
  async update(id: string, data: Tables[T]['Update']): Promise<DbSingleResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Find records by a field value
   */
  async findByField(field: keyof Tables[T]['Row'], value: any): Promise<DbListResponse<Tables[T]['Row']>> {
    const response = await this.client
      .from(this.tableName)
      .select('*')
      .eq(field as string, value);
    
    return { data: response.data, error: response.error };
  }

  /**
   * Count records in the table
   */
  async count(): Promise<number> {
    const response = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    
    return response.count || 0;
  }
}
