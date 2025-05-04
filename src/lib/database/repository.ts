
import { supabase } from '@/lib/supabase';
import { Tables, TableRow, TableInsert, TableUpdate, DbResponse, DbListResponse, DbSingleResponse } from './types';
import { mapDbResponse, asTableId } from './utils';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export class Repository<T extends keyof Tables> {
  tableName: T; // Changed from private to allow access from derived classes

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<DbSingleResponse<TableRow<T>>> {
    const response = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    return mapDbResponse(response);
  }

  /**
   * Find multiple records by a filter
   * @param filters - Type-safe filters to apply to the query
   * @param select - Fields to select
   */
  async findMany(filters?: Partial<Record<keyof TableRow<T>, unknown>>, select: string = '*'): Promise<DbListResponse<TableRow<T>>> {
    let query = supabase
      .from(this.tableName)
      .select(select);

    // Apply filters if provided
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    const response = await query;
    return mapDbResponse(response);
  }

  /**
   * Create a new record
   * @param data - Data to insert
   */
  async create(data: TableInsert<T>): Promise<DbSingleResponse<TableRow<T>>> {
    const response = await supabase
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();
    
    return mapDbResponse(response);
  }

  /**
   * Update an existing record
   * @param id - Record ID
   * @param data - Data to update
   */
  async update(id: string, data: TableUpdate<T>): Promise<DbSingleResponse<TableRow<T>>> {
    const response = await supabase
      .from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    
    return mapDbResponse(response);
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<DbSingleResponse<null>> {
    const response = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    // Return our standardized response format
    if (response.error) {
      return {
        data: null,
        error: response.error,
        status: 'error',
        message: response.error.message
      };
    }
    
    return {
      data: null,
      error: null,
      status: 'success'
    };
  }

  /**
   * Create a custom query
   */
  query(): PostgrestFilterBuilder<any, any, any> {
    return supabase.from(this.tableName).select();
  }
}

// Create repositories for each major entity
export const leaseRepository = new Repository('leases');
export const vehicleRepository = new Repository('vehicles');
export const profileRepository = new Repository('profiles');
export const paymentRepository = new Repository('unified_payments');
export const trafficFineRepository = new Repository('traffic_fines');
export const legalCaseRepository = new Repository('legal_cases');
export const maintenanceRepository = new Repository('maintenance');
