/**
 * BaseService provides common functionality for all service classes
 * including standardized error handling, database connections, and query methods.
 */
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/error-handler';
import { getConnectionStatus } from '@/utils/database-connection';
import { PostgrestResponse, PostgrestSingleResponse, PostgrestFilterBuilder } from '@supabase/supabase-js';

export class BaseService {
  protected tableName: string;

  /**
   * Creates a new service instance for a specific table
   * @param tableName The database table name
   */
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get the Supabase query builder for this table
   * @returns A query builder for the table
   */
  protected get query() {
    return supabase.from(this.tableName);
  }

  /**
   * Safely execute a database query with proper error handling
   * @param queryFn Function that returns a PostgrestFilterBuilder
   * @param errorContext Context for the error message
   */
  protected async executeQuery<T>(
    queryFn: () => PostgrestFilterBuilder<any, any, T[] | null>,
    errorContext: string = 'Query'
  ): Promise<T[] | null> {
    try {
      // Check if database is connected
      const connectionStatus = getConnectionStatus();
      if (connectionStatus === 'disconnected') {
        throw new Error('Database is offline. Please try again later.');
      }

      const { data, error } = await queryFn();

      if (error) {
        throw error;
      }

      return data as T[];
    } catch (error) {
      handleError(error, { context: `${this.tableName} ${errorContext}` });
      return null;
    }
  }

  /**
   * Safely execute a database query that returns a single row
   * @param queryFn Function that returns a PostgrestFilterBuilder
   * @param errorContext Context for the error message
   */
  protected async executeSingleQuery<T>(
    queryFn: () => PostgrestFilterBuilder<any, any, T | null>,
    errorContext: string = 'Query'
  ): Promise<T | null> {
    try {
      const connectionStatus = getConnectionStatus();
      if (connectionStatus === 'disconnected') {
        throw new Error('Database is offline. Please try again later.');
      }

      const { data, error } = await queryFn();

      if (error) {
        throw error;
      }

      return data as T;
    } catch (error) {
      handleError(error, { context: `${this.tableName} ${errorContext}` });
      return null;
    }
  }

  /**
   * Safely execute a database mutation with proper error handling
   * @param mutationFn Function that performs the mutation
   * @param errorContext Context for the error message
   */
  protected async executeMutation<T>(
    mutationFn: () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
    errorContext: string = 'Mutation'
  ): Promise<T | null> {
    try {
      const connectionStatus = getConnectionStatus();
      if (connectionStatus === 'disconnected') {
        throw new Error('Database is offline. Please try again later.');
      }

      const { data, error } = await mutationFn();

      if (error) {
        throw error;
      }

      return data as T;
    } catch (error) {
      handleError(error, { context: `${this.tableName} ${errorContext}` });
      return null;
    }
  }

  /**
   * Get all records with optional filtering
   * @param options Optional query parameters 
   */
  async getAll<T>(options: {
    columns?: string;
    filter?: Record<string, any>;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  } = {}): Promise<T[] | null> {
    const { columns = '*', filter = {}, orderBy, ascending = true, limit } = options;

    return this.executeQuery<T>(() => {
      let query = this.query.select(columns);

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'getAll');
  }

  /**
   * Get a record by ID
   * @param id The record ID
   * @param columns Columns to select
   */
  async getById<T>(id: string, columns: string = '*'): Promise<T | null> {
    return this.executeSingleQuery<T>(
      () => this.query.select(columns).eq('id', id).single(),
      'getById'
    );
  }

  /**
   * Create a new record
   * @param data The data to insert
   */
  async create<T>(data: Partial<T>): Promise<T | null> {
    return this.executeMutation<T>(
      () => this.query.insert(data).select().single(),
      'create'
    );
  }

  /**
   * Update a record by ID
   * @param id The record ID
   * @param data The data to update
   */
  async update<T>(id: string, data: Partial<T>): Promise<T | null> {
    return this.executeMutation<T>(
      () => this.query.update(data).eq('id', id).select().single(),
      'update'
    );
  }

  /**
   * Delete a record by ID
   * @param id The record ID
   */
  async delete<T>(id: string): Promise<T | null> {
    return this.executeMutation<T>(
      () => this.query.delete().eq('id', id).select().single(),
      'delete'
    );
  }
}
