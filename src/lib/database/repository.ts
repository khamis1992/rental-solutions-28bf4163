
import { supabase } from '@/lib/supabase';
import { Tables, TableRow, TableInsert, TableUpdate, isSuccessResponse, UUID } from './types';
import { isValidDatabaseId } from './validation';

/**
 * Generic Repository interface for type-safe database operations
 */
export interface Repository<T extends keyof Tables> {
  findById(id: UUID): Promise<TableRow<T> | null>;
  findAll(): Promise<TableRow<T>[] | null>;
  findBy(column: string, value: any): Promise<TableRow<T>[] | null>;
  create(data: TableInsert<T>): Promise<TableRow<T> | null>;
  update(id: UUID, data: TableUpdate<T>): Promise<TableRow<T> | null>;
  delete(id: UUID): Promise<boolean>;
}

/**
 * Create a type-safe repository for a specific table
 */
export function createRepository<T extends keyof Tables>(tableName: T): Repository<T> {
  return {
    async findById(id: UUID): Promise<TableRow<T> | null> {
      if (!isValidDatabaseId(id)) {
        console.error(`Invalid ID format: ${id}`);
        return null;
      }
      
      const response = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (!isSuccessResponse(response)) {
        console.error(`Failed to fetch ${tableName} with ID ${id}:`, response.error);
        return null;
      }
      
      return response.data as TableRow<T>;
    },
    
    async findAll(): Promise<TableRow<T>[] | null> {
      const response = await supabase
        .from(tableName)
        .select('*');
      
      if (!isSuccessResponse(response)) {
        console.error(`Failed to fetch all ${tableName}:`, response.error);
        return null;
      }
      
      return response.data as TableRow<T>[];
    },
    
    async findBy(column: string, value: any): Promise<TableRow<T>[] | null> {
      const response = await supabase
        .from(tableName)
        .select('*')
        .eq(column, value);
      
      if (!isSuccessResponse(response)) {
        console.error(`Failed to fetch ${tableName} where ${column}=${value}:`, response.error);
        return null;
      }
      
      return response.data as TableRow<T>[];
    },
    
    async create(data: TableInsert<T>): Promise<TableRow<T> | null> {
      const response = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (!isSuccessResponse(response)) {
        console.error(`Failed to create ${tableName}:`, response.error);
        return null;
      }
      
      return response.data as TableRow<T>;
    },
    
    async update(id: UUID, data: TableUpdate<T>): Promise<TableRow<T> | null> {
      if (!isValidDatabaseId(id)) {
        console.error(`Invalid ID format: ${id}`);
        return null;
      }
      
      const response = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (!isSuccessResponse(response)) {
        console.error(`Failed to update ${tableName} with ID ${id}:`, response.error);
        return null;
      }
      
      return response.data as TableRow<T>;
    },
    
    async delete(id: UUID): Promise<boolean> {
      if (!isValidDatabaseId(id)) {
        console.error(`Invalid ID format: ${id}`);
        return false;
      }
      
      const response = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (response.error) {
        console.error(`Failed to delete ${tableName} with ID ${id}:`, response.error);
        return false;
      }
      
      return true;
    }
  };
}

// Export commonly used repositories
export const vehicleRepository = createRepository('vehicles');
export const leaseRepository = createRepository('leases');
export const paymentRepository = createRepository('unified_payments');
export const profileRepository = createRepository('profiles');
export const legalCaseRepository = createRepository('legal_cases');
export const trafficFineRepository = createRepository('traffic_fines');
