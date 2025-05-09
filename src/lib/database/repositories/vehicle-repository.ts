
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asVehicleId, asVehicleStatus } from '../utils';
import { supabase } from '@/lib/supabase';

type VehicleRow = TableRow<'vehicles'>;

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
        .eq('status', asVehicleStatus(status))
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
        error: error instanceof Error ? error : new Error('Unknown error in findByStatus')
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
        .eq('status', asVehicleStatus('available'))
        .order('created_at', { ascending: false });
      
      return { 
        data: response.data || [], 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in findAvailable:", error);
      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error in findAvailable')
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
          error: new Error('Vehicle ID is required')
        };
      }
      
      if (!status) {
        return {
          data: null,
          error: new Error('Status is required')
        };
      }
      
      console.log(`VehicleRepository.updateStatus: Updating vehicle ${vehicleId} to status ${status}`);
      const response = await this.client
        .from('vehicles')
        .update({ status: asVehicleStatus(status) })
        .eq('id', asVehicleId(vehicleId))
        .select()
        .single();
      
      if (response.error) {
        console.error(`VehicleRepository.updateStatus: Error:`, response.error);
      } else {
        console.log(`VehicleRepository.updateStatus: Success, new status:`, response.data?.status);
      }
      
      return { 
        data: response.data || null, 
        error: response.error 
      };
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error in updateStatus')
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
          error: new Error('Vehicle ID is required')
        };
      }
      
      console.log(`VehicleRepository.getWithLease: Fetching vehicle ${vehicleId} with lease information`);
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
        error: error instanceof Error ? error : new Error('Unknown error in getWithLease')
      };
    }
  }

  /**
   * Get vehicle with details including maintenance history and vehicle type
   */
  async findWithDetails(vehicleId: string): Promise<DbSingleResponse<VehicleRow & { maintenance: any[], vehicle_types: any }>> {
    try {
      if (!vehicleId) {
        return {
          data: null,
          error: new Error('Vehicle ID is required')
        };
      }
      
      console.log(`VehicleRepository.findWithDetails: Fetching vehicle ${vehicleId} with maintenance and type information`);
      const response = await this.client
        .from('vehicles')
        .select('*, maintenance(*), vehicle_types(*)')
        .eq('id', asVehicleId(vehicleId))
        .single();
      
      if (response.error) {
        console.error(`VehicleRepository.findWithDetails: Error:`, response.error);
      } else {
        console.log(`VehicleRepository.findWithDetails: Success, found vehicle:`, 
                   JSON.stringify({
                     id: response.data?.id,
                     has_maintenance: Array.isArray(response.data?.maintenance) ? response.data?.maintenance.length > 0 : false,
                     has_vehicle_type: !!response.data?.vehicle_types
                   }));
      }
      
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
        error: error instanceof Error ? error : new Error('Unknown error in findWithDetails')
      };
    }
  }
}

// Export the repository instance and the factory function
export const vehicleRepository = new VehicleRepository(supabase);
export const createVehicleRepository = (client: any) => new VehicleRepository(client);
