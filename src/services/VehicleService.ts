
import { vehicleRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { asVehicleStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';

// Define vehicle type for readability
export type Vehicle = TableRow<'vehicles'>;

// Define types for vehicle filters
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
 * Vehicle service responsible for all operations related to vehicles
 */
export class VehicleService extends BaseService<'vehicles'> {
  constructor() {
    super(vehicleRepository);
  }

  /**
   * Find vehicles with optional filtering
   */
  async findVehicles(filters?: VehicleFilterParams): Promise<ServiceResult<Vehicle[]>> {
    return handleServiceOperation(async () => {
      let query = supabase.from('vehicles')
        .select('*, vehicle_types(*)');
      
      if (filters) {
        // Support for multiple statuses
        if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
          // Map all statuses to DB format using our utility function
          const dbStatuses = filters.statuses.map(status => asVehicleStatus(status));
          query = query.in('status', dbStatuses);
        }
        // Single status filter (backward compatibility)
        else if (filters.status) {
          // Convert application status to database status
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
        
        // Handle sorting
        if (filters.sortBy) {
          const direction = filters.sortDirection || 'asc';
          query = query.order(filters.sortBy, { ascending: direction === 'asc' });
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
      }
      
      return data || [];
    });
  }

  /**
   * Find available vehicles for assignment
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
   * Get vehicle details with maintenance history
   */
  async getVehicleDetails(id: string): Promise<ServiceResult<Vehicle & { maintenance: any[] }>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findWithDetails(id);
      
      if (response.error) {
        throw new Error(`Failed to fetch vehicle details: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Update vehicle status
   */
  async updateStatus(id: string, status: string): Promise<ServiceResult<Vehicle>> {
    return handleServiceOperation(async () => {
      const dbStatus = asVehicleStatus(status);
      const response = await this.repository.updateStatus(id, dbStatus);
      
      if (response.error) {
        throw new Error(`Failed to update vehicle status: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Get vehicle types
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
   * Calculate utilization metrics
   */
  async calculateUtilizationMetrics(vehicleId: string, startDate: Date, endDate: Date): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // Get lease data for this vehicle in the given period
      const { data: leases, error } = await supabase
        .from('leases')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());
        
      if (error) {
        throw new Error(`Failed to calculate vehicle utilization: ${error.message}`);
      }
      
      // Calculate total days in period
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate days the vehicle was rented
      let daysRented = 0;
      leases?.forEach(lease => {
        const leaseStart = new Date(lease.start_date || startDate);
        const leaseEnd = new Date(lease.end_date || endDate);
        
        // Adjust dates to be within our calculation period
        const effectiveStart = leaseStart < startDate ? startDate : leaseStart;
        const effectiveEnd = leaseEnd > endDate ? endDate : leaseEnd;
        
        // Calculate days for this lease and add to total
        const leaseDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        daysRented += Math.max(0, leaseDays);
      });
      
      // Calculate utilization rate
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

// Create singleton instance
export const vehicleService = new VehicleService();
