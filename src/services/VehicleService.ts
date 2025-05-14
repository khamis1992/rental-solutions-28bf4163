
import { BaseService } from './BaseService';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/error-handler';

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

/**
 * Service for managing vehicle data
 */
export class VehicleService extends BaseService {
  constructor() {
    super('vehicles');
  }

  /**
   * Get all vehicles with filtering and pagination
   */
  async getVehicles(filters: VehicleFilterParams = {}): Promise<PaginatedResult<Vehicle> | null> {
    try {
      const {
        status,
        statuses,
        make,
        model,
        year,
        minYear,
        maxYear,
        searchTerm,
        sortBy = 'created_at',
        sortDirection = 'desc',
        location,
        vehicle_type_id,
        limit = 10,
        offset = 0
      } = filters;

      // Start building the query
      let query = this.query.select('*, vehicle_types(*)');

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      if (make) {
        query = query.ilike('make', `%${make}%`);
      }

      if (model) {
        query = query.ilike('model', `%${model}%`);
      }

      if (year) {
        query = query.eq('year', year);
      }

      if (minYear) {
        query = query.gte('year', minYear);
      }

      if (maxYear) {
        query = query.lte('year', maxYear);
      }

      if (location) {
        query = query.eq('location', location);
      }

      if (vehicle_type_id) {
        query = query.eq('vehicle_type_id', vehicle_type_id);
      }

      // Text search across multiple fields
      if (searchTerm) {
        query = query.or(
          `license_plate.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`
        );
      }

      // Get total count (without pagination)
      const { count, error: countError } = await query.count();
      
      if (countError) {
        throw countError;
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data.map(vehicle => ({
          ...vehicle,
          vehicleType: vehicle.vehicle_types,
        })) as Vehicle[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Vehicle listing' });
      return null;
    }
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        vehicleType: data.vehicle_types
      } as Vehicle;
    } catch (error) {
      handleError(error, { context: 'Vehicle details' });
      return null;
    }
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle | null> {
    try {
      const { data: newVehicle, error } = await supabase
        .from('vehicles')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newVehicle as Vehicle;
    } catch (error) {
      handleError(error, { context: 'Create vehicle' });
      return null;
    }
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
    try {
      const { data: updatedVehicle, error } = await supabase
        .from('vehicles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedVehicle as Vehicle;
    } catch (error) {
      handleError(error, { context: 'Update vehicle' });
      return null;
    }
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: string): Promise<Vehicle | null> {
    try {
      const { data: deletedVehicle, error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedVehicle as Vehicle;
    } catch (error) {
      handleError(error, { context: 'Delete vehicle' });
      return null;
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(id: string, status: string): Promise<Vehicle | null> {
    try {
      const { data: updatedVehicle, error } = await supabase
        .from('vehicles')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedVehicle as Vehicle;
    } catch (error) {
      handleError(error, { context: 'Update vehicle status' });
      return null;
    }
  }

  /**
   * Get vehicle types
   */
  async getVehicleTypes(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      handleError(error, { context: 'Vehicle types' });
      return null;
    }
  }

  /**
   * Get available vehicles
   */
  async getAvailableVehicles(): Promise<Vehicle[] | null> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types(*)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(vehicle => ({
        ...vehicle,
        vehicleType: vehicle.vehicle_types
      })) as Vehicle[];
    } catch (error) {
      handleError(error, { context: 'Available vehicles' });
      return null;
    }
  }
}

// Export a singleton instance
export const vehicleService = new VehicleService();
