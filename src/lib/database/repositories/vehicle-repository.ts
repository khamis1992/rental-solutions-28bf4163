
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { asVehicleId } from '@/lib/database-types';

type VehicleRow = TableRow<'vehicles'>;

// Create a custom error type that extends Error and implements PostgrestError
class RepositoryError implements PostgrestError {
  code: string;
  details: string;
  hint: string;
  message: string;
  name: string = 'PostgrestError';
  
  constructor(message: string) {
    this.message = message;
    this.code = 'CUSTOM_ERROR';
    this.details = message;
    this.hint = '';
  }
}

/**
 * Repository for vehicle-related database operations
 */
export class VehicleRepository extends Repository<'vehicles'> {
  constructor(client: any) {
    super(client, 'vehicles');
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(status: string): Promise<DbListResponse<VehicleRow>> {
    console.log(`VehicleRepository.findByStatus called with status: ${status}`);
    try {
      const response = await this.client
        .from('vehicles')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      console.log(`findByStatus response:`, response);
      return { 
        data: response.data || [], 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in findByStatus:", error);
      return {
        data: [],
        error: new RepositoryError(`Unknown error in findByStatus: ${error instanceof Error ? error.message : String(error)}`)
      };
    }
  }

  /**
   * Find available vehicles (those not currently assigned)
   */
  async findAvailable(): Promise<DbListResponse<VehicleRow>> {
    try {
      const response = await this.client
        .from('vehicles')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      return { 
        data: response.data || [], 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in findAvailable:", error);
      return {
        data: [],
        error: new RepositoryError(`Unknown error in findAvailable: ${error instanceof Error ? error.message : String(error)}`)
      };
    }
  }

  /**
   * Update vehicle status
   */
  async updateStatus(vehicleId: string, status: string): Promise<DbSingleResponse<VehicleRow>> {
    try {
      if (!vehicleId) {
        return {
          data: null,
          error: new RepositoryError('Vehicle ID is required')
        };
      }
      
      if (!status) {
        return {
          data: null,
          error: new RepositoryError('Status is required')
        };
      }
      
      const response = await this.client
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId)
        .select()
        .single();
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return {
        data: null,
        error: new RepositoryError(`Unknown error in updateStatus: ${error instanceof Error ? error.message : String(error)}`)
      };
    }
  }

  /**
   * Get vehicle with current lease information
   */
  async getWithLease(vehicleId: string): Promise<DbSingleResponse<VehicleRow & { leases: any[] }>> {
    try {
      if (!vehicleId) {
        return {
          data: null,
          error: new RepositoryError('Vehicle ID is required')
        };
      }
      
      const response = await this.client
        .from('vehicles')
        .select('*, leases(*)')
        .eq('id', asVehicleId(vehicleId))
        .single();
      
      // Ensure leases is always an array
      if (response.data && !Array.isArray(response.data.leases)) {
        response.data.leases = [];
      }
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in getWithLease:", error);
      return {
        data: null,
        error: new RepositoryError(`Unknown error in getWithLease: ${error instanceof Error ? error.message : String(error)}`)
      };
    }
  }

  /**
   * Get vehicle with details including maintenance history
   */
  async findWithDetails(vehicleId: string): Promise<DbSingleResponse<VehicleRow & { maintenance: any[] }>> {
    try {
      if (!vehicleId) {
        return {
          data: null,
          error: new RepositoryError('Vehicle ID is required')
        };
      }
      
      const response = await this.client
        .from('vehicles')
        .select('*, maintenance:vehicle_maintenance(*)')
        .eq('id', asVehicleId(vehicleId))
        .single();
      
      // Ensure maintenance is always an array
      if (response.data && !Array.isArray(response.data.maintenance)) {
        response.data.maintenance = [];
      }
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in findWithDetails:", error);
      return {
        data: null,
        error: new RepositoryError(`Unknown error in findWithDetails: ${error instanceof Error ? error.message : String(error)}`)
      };
    }
  }
}

// Export the repository instance and the factory function
export const vehicleRepository = new VehicleRepository(supabase);
export const createVehicleRepository = (client: any) => new VehicleRepository(client);
