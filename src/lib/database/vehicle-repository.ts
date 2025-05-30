
import { supabase } from '@/lib/supabase';
import { DbTables } from './types';

export interface VehicleFilters {
  status?: string;
  make?: string;
  model?: string;
  year?: number;
}

export class VehicleRepository {
  constructor(private client: any) {}

  async findAll(filters?: VehicleFilters): Promise<{ data: DbTables['vehicles']['Row'][] | null; error: any }> {
    try {
      let query = this.client.from('vehicles').select('*');
      
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
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return { data: null, error };
    }
  }

  async findById(id: string): Promise<{ data: DbTables['vehicles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching vehicle by ID:', error);
      return { data: null, error };
    }
  }

  async create(vehicleData: DbTables['vehicles']['Insert']): Promise<{ data: DbTables['vehicles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return { data: null, error };
    }
  }

  async update(id: string, updates: DbTables['vehicles']['Update']): Promise<{ data: DbTables['vehicles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return { data: null, error };
    }
  }

  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.client
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return { error };
    }
  }

  async findAvailable(): Promise<{ data: DbTables['vehicles']['Row'][] | null; error: any }> {
    return this.findAll({ status: 'available' });
  }

  async updateStatus(id: string, status: string): Promise<{ data: DbTables['vehicles']['Row'] | null; error: any }> {
    return this.update(id, { status });
  }
}

export const vehicleRepository = new VehicleRepository(supabase);
export const createVehicleRepository = (client: any) => new VehicleRepository(client);
