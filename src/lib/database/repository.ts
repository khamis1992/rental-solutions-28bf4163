
import { PostgrestError } from '@supabase/supabase-js';
import { DbListResponse, DbSingleResponse, Tables } from './types';

/**
 * Base repository class providing common database operations for a specific table
 */
export class Repository<T extends keyof Tables> {
  protected client: any;
  protected tableName: T;

  constructor(client: any, tableName: T) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      const pgError: PostgrestError = {
        message: error instanceof Error ? error.message : String(error),
        details: '',
        hint: '',
        code: 'CUSTOM_ERROR'
      };
      
      return {
        data: null,
        error: pgError
      };
    }
  }

  /**
   * Find all records in the table
   */
  async findAll(): Promise<DbListResponse<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      return { 
        data: response.data || [], 
        error: response.error 
      };
    } catch (error) {
      const pgError: PostgrestError = {
        message: error instanceof Error ? error.message : String(error),
        details: '',
        hint: '',
        code: 'CUSTOM_ERROR'
      };
      
      return {
        data: [],
        error: pgError
      };
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<Tables[T]['Row']>): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      const pgError: PostgrestError = {
        message: error instanceof Error ? error.message : String(error),
        details: '',
        hint: '',
        code: 'CUSTOM_ERROR'
      };
      
      return {
        data: null,
        error: pgError
      };
    }
  }

  /**
   * Update a record
   */
  async update(id: string, data: Partial<Tables[T]['Row']>): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      const pgError: PostgrestError = {
        message: error instanceof Error ? error.message : String(error),
        details: '',
        hint: '',
        code: 'CUSTOM_ERROR'
      };
      
      return {
        data: null,
        error: pgError
      };
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<DbSingleResponse<Tables[T]['Row']>> {
    try {
      const response = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      const pgError: PostgrestError = {
        message: error instanceof Error ? error.message : String(error),
        details: '',
        hint: '',
        code: 'CUSTOM_ERROR'
      };
      
      return {
        data: null,
        error: pgError
      };
    }
  }
}

/**
 * Factory function to create a repository for a specific table
 */
export function createRepository<T extends keyof Tables>(tableName: T) {
  return {
    create: async (data: Partial<Tables[T]['Row']>) => {
      try {
        const response = await supabase
          .from(tableName)
          .insert(data)
          .select()
          .single();
        
        return { 
          data: response.data || null, 
          error: response.error 
        };
      } catch (error) {
        const pgError: PostgrestError = {
          message: error instanceof Error ? error.message : String(error),
          details: '',
          hint: '',
          code: 'CUSTOM_ERROR'
        };
        
        return {
          data: null,
          error: pgError
        };
      }
    },
    
    findById: async (id: string) => {
      try {
        const response = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
        
        return { 
          data: response.data || null, 
          error: response.error 
        };
      } catch (error) {
        const pgError: PostgrestError = {
          message: error instanceof Error ? error.message : String(error),
          details: '',
          hint: '',
          code: 'CUSTOM_ERROR'
        };
        
        return {
          data: null,
          error: pgError
        };
      }
    },
    
    findAll: async () => {
      try {
        const response = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
        
        return { 
          data: response.data || [], 
          error: response.error 
        };
      } catch (error) {
        const pgError: PostgrestError = {
          message: error instanceof Error ? error.message : String(error),
          details: '',
          hint: '',
          code: 'CUSTOM_ERROR'
        };
        
        return {
          data: [],
          error: pgError
        };
      }
    },
    
    update: async (id: string, data: Partial<Tables[T]['Row']>) => {
      try {
        const response = await supabase
          .from(tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        return { 
          data: response.data || null, 
          error: response.error 
        };
      } catch (error) {
        const pgError: PostgrestError = {
          message: error instanceof Error ? error.message : String(error),
          details: '',
          hint: '',
          code: 'CUSTOM_ERROR'
        };
        
        return {
          data: null,
          error: pgError
        };
      }
    },
    
    delete: async (id: string) => {
      try {
        const response = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)
          .select()
          .single();
        
        return { 
          data: response.data || null, 
          error: response.error 
        };
      } catch (error) {
        const pgError: PostgrestError = {
          message: error instanceof Error ? error.message : String(error),
          details: '',
          hint: '',
          code: 'CUSTOM_ERROR'
        };
        
        return {
          data: null,
          error: pgError
        };
      }
    }
  };
}

// Need to import supabase after defining the types to avoid circular dependencies
import { supabase } from '@/lib/supabase';
