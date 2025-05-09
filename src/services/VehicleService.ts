import { vehicleRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { asVehicleStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';

export type Vehicle = TableRow<'vehicles'>;

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
  [key: string]: any;
}

/**
 * Service responsible for managing vehicle operations in the fleet management system.
 * Handles vehicle data management, status updates, and fleet analytics.
 */
export class VehicleService extends BaseService<'vehicles'> {
  constructor() {
    super(vehicleRepository);
  }

  /**
   * Finds vehicles based on specified filtering criteria
   * @param filters - Optional filtering parameters for vehicle search
   * @returns Promise with filtered vehicle records
   * @throws Error if database operation fails
   */
  async findVehicles(filters?: VehicleFilterParams): Promise<ServiceResult<Vehicle[]>> {
    return handleServiceOperation(async () => {
      console.log("VehicleService.findVehicles called with filters:", filters);
      let query = supabase.from('vehicles')
        .select('*, vehicle_types(*)');
      
      if (filters) {
        if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
          console.log("Filtering by statuses:", filters.statuses);
          // Map each status to its database representation
          const dbStatuses = filters.statuses.map(status => asVehicleStatus(status));
          query = query.in('status', dbStatuses);
          console.log("Mapped to DB statuses:", dbStatuses);
        } else if (filters.status) {
          console.log("Filtering by single status:", filters.status);
          const dbStatus = asVehicleStatus(filters.status);
          query = query.eq('status', dbStatus);
        }
        
        // Apply other filters
        if (filters.make) query = query.eq('make', filters.make);
        if (filters.model) query = query.eq('model', filters.model);
        if (filters.year) query = query.eq('year', filters.year);
        if (filters.location) query = query.eq('location', filters.location);
        if (filters.vehicle_type_id) query = query.eq('vehicle_type_id', filters.vehicle_type_id);
        
        if (filters.searchTerm) {
          query = query.or(
            `license_plate.ilike.%${filters.searchTerm}%,make.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,vin.ilike.%${filters.searchTerm}%`
          );
        }
        
        if (filters.sortBy) {
          const direction = filters.sortDirection || 'asc';
          query = query.order(filters.sortBy, { ascending: direction === 'asc' });
        }
      } else {
        console.log("No filters provided, fetching all vehicles");
      }
      
      console.log("Executing Supabase query");
      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase query error:", error);
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
      }
      
      console.log(`Retrieved ${data?.length || 0} vehicles`);
      // Always return an array, even if data is null
      return data || [];
    });
  }

  /**
   * Retrieves available vehicles ready for assignment
   * Filters vehicles with 'available' status for rental assignments
   * @returns Promise with list of available vehicles
   */
  async findAvailableVehicles(): Promise<ServiceResult<Vehicle[]>> {
    return handleServiceOperation(async () => {
      console.log("Finding available vehicles");
      const response = await this.repository.findByStatus(asVehicleStatus('available'));
      
      if (response.error) {
        console.error("Error finding available vehicles:", response.error);
        throw new Error(`Failed to fetch available vehicles: ${response.error.message}`);
      }
      
      // Always return an array, even if data is null
      return response.data || [];
    });
  }

  /**
   * Retrieves detailed vehicle information including maintenance history
   * @param id - Vehicle identifier
   * @returns Promise with vehicle details and associated maintenance records
   */
  async getVehicleDetails(id: string): Promise<ServiceResult<Vehicle & { maintenance: any[], vehicleType?: any }>> {
    return handleServiceOperation(async () => {
      if (!id) {
        throw new Error("Vehicle ID is required for getVehicleDetails");
      }
      
      console.log(`VehicleService.getVehicleDetails: Fetching details for vehicle ID ${id}`);
      const response = await this.repository.findWithDetails(id);
      
      if (response.error) {
        console.error(`VehicleService.getVehicleDetails: Error fetching details:`, response.error);
        throw new Error(`Failed to fetch vehicle details for ID ${id}: ${response.error.message}`);
      }
      
      if (!response.data) {
        console.error(`VehicleService.getVehicleDetails: No data returned for vehicle ID ${id}`);
        throw new Error(`No vehicle found with ID ${id}`);
      }
      
      console.log(`VehicleService.getVehicleDetails: Successfully fetched vehicle data:`, 
                 JSON.stringify({
                   id: response.data.id,
                   make: response.data.make,
                   model: response.data.model,
                   hasVehicleTypes: !!response.data.vehicle_types,
                   maintenanceCount: Array.isArray(response.data.maintenance) ? response.data.maintenance.length : 'n/a'
                 }));
      
      // Ensure maintenance is always an array
      if (!response.data.maintenance) {
        response.data.maintenance = [];
      }
      
      // Map vehicle_types to vehicleType for compatibility
      if (response.data.vehicle_types) {
        const vehicleData = response.data as any;
        vehicleData.vehicleType = {
          id: response.data.vehicle_types.id,
          name: response.data.vehicle_types.name,
          daily_rate: response.data.vehicle_types.daily_rate,
          size: response.data.vehicle_types.size
        };
        
        // If the vehicle doesn't have a daily rate set directly, use the one from the vehicle type
        if (!vehicleData.dailyRate && response.data.vehicle_types.daily_rate) {
          vehicleData.dailyRate = response.data.vehicle_types.daily_rate;
        }
        
        console.log(`VehicleService.getVehicleDetails: Mapped vehicle_types to vehicleType:`, 
                   JSON.stringify(vehicleData.vehicleType));
      } else {
        console.warn(`VehicleService.getVehicleDetails: No vehicle_types data found for vehicle ${id}`);
        // Add an empty vehicleType object to prevent null reference errors
        (response.data as any).vehicleType = {
          name: "Standard",
          daily_rate: response.data.rent_amount || 0
        };
      }
      
      return response.data;
    });
  }

  /**
   * Updates vehicle operational status
   * @param id - Vehicle identifier
   * @param status - New vehicle status
   * @returns Promise with updated vehicle record
   */
  async updateStatus(id: string, status: string): Promise<ServiceResult<Vehicle>> {
    return handleServiceOperation(async () => {
      if (!id) {
        throw new Error("Vehicle ID is required for updateStatus");
      }
      
      if (!status) {
        throw new Error("Status value is required for updateStatus");
      }
      
      console.log(`VehicleService.updateStatus: Updating vehicle ${id} status to ${status}`);
      const dbStatus = asVehicleStatus(status);
      console.log(`VehicleService.updateStatus: Mapped status to DB format: ${dbStatus}`);
      
      const response = await this.repository.updateStatus(id, dbStatus);
      
      if (response.error) {
        console.error(`VehicleService.updateStatus: Error updating status:`, response.error);
        throw new Error(`Failed to update vehicle status to ${status} for vehicle ID ${id}: ${response.error.message}`);
      }
      
      if (!response.data) {
        console.error(`VehicleService.updateStatus: No data returned after status update for vehicle ID ${id}`);
        throw new Error(`Vehicle with ID ${id} not found`);
      }
      
      console.log(`VehicleService.updateStatus: Successfully updated status for vehicle ${id}`);
      return response.data;
    });
  }

  /**
   * Gets vehicle types and categories
   * @returns Promise with list of vehicle types
   */
  async getVehicleTypes(): Promise<ServiceResult<any[]>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Failed to fetch vehicle types: ${error.message}`);
      }
      
      // Always return an array, even if data is null
      return data || [];
    });
  }

  /**
   * Calculates vehicle utilization metrics for a specified period
   * @param vehicleId - Vehicle identifier
   * @param startDate - Beginning of analysis period
   * @param endDate - End of analysis period
   * @returns Promise with utilization metrics including revenue and occupancy rate
   */
  async calculateUtilizationMetrics(
    vehicleId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      if (!vehicleId) {
        throw new Error("Vehicle ID is required for calculateUtilizationMetrics");
      }
      
      if (!startDate || !endDate) {
        throw new Error("Both startDate and endDate are required for calculateUtilizationMetrics");
      }
      
      const { data: leases, error } = await supabase
        .from('leases')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());
        
      if (error) {
        throw new Error(`Failed to calculate vehicle utilization for vehicle ID ${vehicleId} from ${startDate.toISOString()} to ${endDate.toISOString()}: ${error.message}`);
      }
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let daysRented = 0;
      const safeLeases = leases || [];
      safeLeases.forEach(lease => {
        const leaseStart = new Date(lease.start_date || startDate);
        const leaseEnd = new Date(lease.end_date || endDate);
        
        const effectiveStart = leaseStart < startDate ? startDate : leaseStart;
        const effectiveEnd = leaseEnd > endDate ? endDate : leaseEnd;
        
        const leaseDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        daysRented += Math.max(0, leaseDays);
      });
      
      const utilizationRate = totalDays > 0 ? (daysRented / totalDays) * 100 : 0;
      
      return {
        totalDays,
        daysRented,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        leasesCount: safeLeases.length || 0
      };
    });
  }
}

export const vehicleService = new VehicleService();
