
import { vehicleRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from '../base/BaseService';
import { asVehicleStatus } from '@/types/database-common';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFilterParams, VehicleType } from './types';

/**
 * Service responsible for managing vehicle inventory operations
 * Handles core vehicle data, search/filter, and status management
 */
export class VehicleInventoryService extends BaseService<'vehicles'> {
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
        
        if (filters.searchTerm || filters.search) {
          const term = filters.searchTerm || filters.search;
          query = query.or(
            `license_plate.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,vin.ilike.%${term}%`
          );
        }
        
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
   * Retrieves detailed vehicle information
   * @param id - Vehicle identifier
   * @returns Promise with vehicle details
   */
  async getVehicleDetails(id: string): Promise<ServiceResult<Vehicle>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch vehicle details: ${error.message}`);
      }
      
      return data;
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
        throw new Error(`Failed to update vehicle status: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Gets vehicle types and categories
   * @returns Promise with list of vehicle types
   */
  async getVehicleTypes(): Promise<ServiceResult<VehicleType[]>> {
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
}

export const vehicleInventoryService = new VehicleInventoryService();
