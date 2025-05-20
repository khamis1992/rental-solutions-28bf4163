
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asVehicleId, asVehicleStatus } from '../database-types';
import { supabase } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

function toPostgrestError(error: unknown, name: string): PostgrestError {
  return {
    name,
    message: error instanceof Error ? error.message : String(error),
    details: '',
    hint: '',
    code: ''
  };
}

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
        error: toPostgrestError(error, 'FindByStatusError')
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
        error: toPostgrestError(error, 'FindAvailableError')
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
        error: toPostgrestError(error, 'UpdateStatusError')
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
        error: toPostgrestError(error, 'GetWithLeaseError')
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
        error: toPostgrestError(error, 'FindWithDetailsError')
      };
    }
  }

  /**
   * Get vehicles requiring maintenance based on service interval
   * Added for microservices
   */
  async findVehiclesRequiringMaintenance(): Promise<DbListResponse<VehicleRow>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find vehicles with maintenance records older than 30 days or no maintenance records
      const response = await this.client
        .from('vehicles')
        .select('*, maintenance(*)')
        .or(`status.neq.maintenance,status.eq.available`)
        .order('created_at', { ascending: false });
      
      if (response.error) {
        console.error("Error in findVehiclesRequiringMaintenance:", response.error);
        return {
          data: [],
          error: response.error
        };
      }
      
      // Filter vehicles that need maintenance (no maintenance records or old ones)
      const vehiclesNeedingMaintenance = (response.data || []).filter(vehicle => {
        const maintenance = Array.isArray(vehicle.maintenance) ? vehicle.maintenance : [];
        
        // If no maintenance records, needs maintenance
        if (maintenance.length === 0) return true;
        
        // Find newest maintenance record
        const newestMaintenance = maintenance.reduce((newest, current) => {
          const currentDate = new Date(current.completion_date || current.created_at);
          const newestDate = new Date(newest.completion_date || newest.created_at);
          return currentDate > newestDate ? current : newest;
        }, maintenance[0]);
        
        // Check if newest maintenance is older than 30 days
        const newestDate = new Date(newestMaintenance.completion_date || newestMaintenance.created_at);
        return newestDate < thirtyDaysAgo;
      });
      
      return {
        data: vehiclesNeedingMaintenance,
        error: null
      };
    } catch (error) {
      console.error("Error in findVehiclesRequiringMaintenance:", error);
      return {
        data: [],
        error: toPostgrestError(error, 'FindVehiclesRequiringMaintenanceError')
      };
    }
  }

  /**
   * Find vehicles with filtering options 
   * Added for microservices
   */
  async findVehicles(filters: {
    status?: string | string[];
    make?: string;
    model?: string;
    licensePlate?: string;
    available?: boolean;
  } = {}): Promise<DbListResponse<VehicleRow>> {
    try {
      let query = this.client
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status.map(s => asVehicleStatus(s)));
        } else {
          query = query.eq('status', asVehicleStatus(filters.status));
        }
      }
      
      if (filters.make) {
        query = query.ilike('make', `%${filters.make}%`);
      }
      
      if (filters.model) {
        query = query.ilike('model', `%${filters.model}%`);
      }
      
      if (filters.licensePlate) {
        query = query.ilike('license_plate', `%${filters.licensePlate}%`);
      }
      
      if (filters.available === true) {
        query = query.eq('status', asVehicleStatus('available'));
      }
      
      const response = await query;
      
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error("Error in findVehicles:", error);
      return {
        data: [],
        error: toPostgrestError(error, 'FindVehiclesError')
      };
    }
  }
}

// Export the repository instance and the factory function
export const vehicleRepository = new VehicleRepository(supabase);
export const createVehicleRepository = (client: any) => new VehicleRepository(client);
