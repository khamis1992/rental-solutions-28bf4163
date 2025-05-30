
import { supabase } from '@/lib/supabase';
import { BaseService, ServiceResult } from './base/BaseService';
import { Vehicle } from '@/types/vehicle';
import { VehicleStatus } from '@/lib/database/database-types';

export interface VehicleFilterParams {
  status?: VehicleStatus;
  make?: string;
  model?: string;
  year?: number;
  search?: string;
}

export class VehicleService extends BaseService {
  constructor() {
    super(supabase);
  }

  async getVehicles(filters?: VehicleFilterParams): Promise<ServiceResult<Vehicle[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('vehicles').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.make) {
        query = query.ilike('make', `%${filters.make}%`);
      }
      if (filters?.model) {
        query = query.ilike('model', `%${filters.model}%`);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }, 'Failed to fetch vehicles');
  }

  async getVehicleById(id: string): Promise<ServiceResult<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Vehicle not found');
      
      return data;
    }, 'Failed to fetch vehicle');
  }

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<ServiceResult<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'Failed to create vehicle');
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<ServiceResult<Vehicle>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'Failed to update vehicle');
  }

  async deleteVehicle(id: string): Promise<ServiceResult<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }, 'Failed to delete vehicle');
  }

  async getAvailableVehicles(): Promise<ServiceResult<Vehicle[]>> {
    return this.getVehicles({ status: 'available' });
  }

  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<ServiceResult<Vehicle>> {
    return this.updateVehicle(id, { status });
  }

  async getVehiclesByStatus(status: VehicleStatus): Promise<ServiceResult<Vehicle[]>> {
    return this.getVehicles({ status });
  }

  async searchVehicles(searchTerm: string): Promise<ServiceResult<Vehicle[]>> {
    return this.getVehicles({ search: searchTerm });
  }
}

export const vehicleService = new VehicleService();
