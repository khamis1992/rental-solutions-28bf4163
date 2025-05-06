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
      let query = supabase.from('vehicles')
        .select('*, vehicle_types(*)');
      
      if (filters) {
        if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
          const dbStatuses = filters.statuses.map(status => asVehicleStatus(status));
          query = query.in('status', dbStatuses);
        } else if (filters.status) {
          const dbStatus = asVehicleStatus(filters.status);
          query = query.eq('status', dbStatus);
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
        
        if (filters.minYear && filters.maxYear) {
          query = query.gte('year', filters.minYear).lte('year', filters.maxYear);
        } else if (filters.minYear) {
          query = query.gte('year', filters.minYear);
        } else if (filters.maxYear) {
          query = query.lte('year', filters.maxYear);
        }
        
        if (filters.location) {
          query = query.eq('location', filters.location);
        }

        if (filters.vehicle_type_id) {
          query = query.eq('vehicle_type_id', filters.vehicle_type_id);
        }
        
        if (filters.searchTerm) {
          query = query.or(
            `license_plate.ilike.%${filters.searchTerm}%,make.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,vin.ilike.%${filters.searchTerm}%`
          );
        }
        
        if (filters.sortBy) {
          const direction = filters.sortDirection || 'asc';
          query = query.order(filters.sortBy, { ascending: direction === 'asc' });
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch vehicles with filters ${JSON.stringify(filters)}: ${error.message}`);
      }
      
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
      const response = await this.repository.findByStatus(asVehicleStatus('available'));
      
      if (response.error) {
        throw new Error(`Failed to fetch available vehicles: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Retrieves detailed vehicle information including maintenance history
   * @param id - Vehicle identifier
   * @returns Promise with vehicle details and associated maintenance records
   */
  async getVehicleDetails(id: string): Promise<ServiceResult<Vehicle & { maintenance: any[] }>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findWithDetails(id);
      
      if (response.error) {
        throw new Error(`Failed to fetch vehicle details for ID ${id}: ${response.error.message}`);
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
      const dbStatus = asVehicleStatus(status);
      const response = await this.repository.updateStatus(id, dbStatus);
      
      if (response.error) {
        throw new Error(`Failed to update vehicle status to ${status} for vehicle ID ${id}: ${response.error.message}`);
      }
      
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
      leases?.forEach(lease => {
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
        leasesCount: leases?.length || 0
      };
    });
  }
}

export const vehicleService = new VehicleService();
