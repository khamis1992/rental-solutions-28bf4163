
import { supabase } from '@/lib/supabase';
import { VehicleRow } from './types';
import { asVehicleStatus, asVehicleId } from '@/lib/database-types';
import { PostgrestError } from '@supabase/supabase-js';

// Create a custom repository error type
class RepositoryError implements PostgrestError {
  name: string = 'PostgrestError';
  message: string;
  details: string;
  hint: string;
  code: string;
  
  constructor(message: string) {
    this.message = message;
    this.code = 'CUSTOM_ERROR';
    this.details = message;
    this.hint = '';
  }
}

// Prepare base repository operations
const baseOperations = {
  // Find by ID
  findById: async (id: string) => {
    const response = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
      
    return {
      data: response.data,
      error: response.error
    };
  },
  
  // Update vehicle
  update: async (id: string, data: Partial<VehicleRow>) => {
    const response = await supabase
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    return {
      data: response.data,
      error: response.error
    };
  }
};

// Extended repository with vehicle-specific operations
export const vehicleRepository = {
  ...baseOperations,
  
  // Find vehicles with type-safe filters
  async findVehicles(filters: {
    status?: string;
    make?: string;
    model?: string;
    year?: number;
    available?: boolean;
  } = {}) {
    try {
      let query = supabase.from('vehicles').select('*');
      
      if (filters.status) {
        query = query.eq('status', asVehicleStatus(filters.status));
      }
      
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      
      if (filters.model) {
        query = query.eq('model', filters.model);
      }
      
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.available) {
        query = query.eq('status', 'available');
      }
      
      const response = await query;
      
      if (response.error) {
        console.error('Failed to fetch vehicles with filters:', response.error);
        return { data: null, error: response.error };
      }
      
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error in findVehicles:', error);
      const pgError = new RepositoryError(`Unknown error in findVehicles: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  },
  
  // Update vehicle status with validation
  async updateStatus(id: string, status: string) {
    try {
      const validatedStatus = asVehicleStatus(status);
      
      const response = await supabase
        .from('vehicles')
        .update({ 
          status: validatedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      return {
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error(`Error updating vehicle ${id} status to ${status}:`, error);
      const pgError = new RepositoryError(`Failed to update vehicle status: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  },
  
  // Find available vehicles
  async findAvailableVehicles() {
    try {
      const response = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available');
        
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error('Error in findAvailableVehicles:', error);
      const pgError = new RepositoryError(`Unknown error in findAvailableVehicles: ${error instanceof Error ? error.message : String(error)}`);
      return { data: [], error: pgError };
    }
  }
};
