import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Vehicle, VehicleStatus } from '@/types/vehicle.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

export interface VehicleFilterParams {
  statuses?: VehicleStatus[];
  make?: string;
  model?: string;
  year?: number;
  search?: string;
}

export class VehicleService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchVehicles(filters?: VehicleFilterParams): Promise<Result<Vehicle[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('vehicles').select('*');

      if (filters) {
        if (filters.statuses && filters.statuses.length > 0) {
          query = query.in('status', filters.statuses);
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
        
        if (filters.search) {
          query = query.or(`vin.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch vehicles',
          'VehicleService',
          'fetchVehicles'
        );
      }

      return data as Vehicle[];
    }, 'Failed to fetch vehicles');
  }

  async getVehicleById(id: string): Promise<Result<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch vehicle',
          'VehicleService',
          'getVehicleById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Vehicle not found',
          'VehicleService',
          'getVehicleById'
        );
      }
      
      return data;
    }, 'Failed to fetch vehicle');
  }

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Result<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create vehicle',
          'VehicleService',
          'createVehicle'
        );
      }

      return data;
    }, 'Failed to create vehicle');
  }

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Result<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update vehicle',
          'VehicleService',
          'updateVehicle'
        );
      }

      if (!data) {
        throw createServiceError(
          'Vehicle not found',
          'VehicleService',
          'updateVehicle'
        );
      }

      return data;
    }, 'Failed to update vehicle');
  }

  async deleteVehicle(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete vehicle',
          'VehicleService',
          'deleteVehicle'
        );
      }

      return true;
    }, 'Failed to delete vehicle');
  }

  async getAvailableVehicles(): Promise<Result<Vehicle[]>> {
    return this.fetchVehicles({ statuses: ['available'] });
  }

  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Result<Vehicle>> {
    return this.updateVehicle(id, { status });
  }

  async getVehiclesByStatus(status: VehicleStatus): Promise<Result<Vehicle[]>> {
    return this.fetchVehicles({ statuses: [status] });
  }

  async searchVehicles(searchTerm: string): Promise<Result<Vehicle[]>> {
    return this.fetchVehicles({ search: searchTerm });
  }
}

export const vehicleService = new VehicleService();
