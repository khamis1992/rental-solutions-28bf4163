import { Database } from '@/types/database.types';
import { VehicleRow, VehicleInsert, VehicleUpdate, VehicleFilters, ExtendedVehicle, VehicleStatus } from '@/types/vehicle';
import { createClient } from '@supabase/supabase-js';
import { isTableRow } from '@/lib/database/validation/typeGuards';

export class VehicleRepository {
  private supabase;

  constructor() {
    this.supabase = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  async findAll(filters?: VehicleFilters): Promise<{ data: ExtendedVehicle[] | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from('vehicles')
        .select(`
          *,
          agreements:leases(*),
          vehicle_type:vehicle_types(*),
          maintenance_records:maintenance(*)
        `);

      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status as VehicleStatus);
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
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data?.map(vehicle => ({
          ...vehicle,
          full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
          status_display: vehicle.status,
          type_display: vehicle.vehicle_type?.name
        })) || null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async findById(id: string): Promise<{ data: ExtendedVehicle | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .select(`
          *,
          agreements:leases(*),
          vehicle_type:vehicle_types(*),
          maintenance_records:maintenance(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          ...data,
          full_name: `${data.make} ${data.model} (${data.license_plate})`,
          status_display: data.status,
          type_display: data.vehicle_type?.name
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async create(vehicle: VehicleInsert): Promise<{ data: VehicleRow | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async update(id: string, vehicle: VehicleUpdate): Promise<{ data: VehicleRow | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .update(vehicle)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async findAvailable(): Promise<{ data: ExtendedVehicle[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .select(`
          *,
          agreements:leases(*),
          vehicle_type:vehicle_types(*),
          maintenance_records:maintenance(*)
        `)
        .eq('status', 'available' as VehicleStatus);

      if (error) throw error;

      return {
        data: data?.map(vehicle => ({
          ...vehicle,
          full_name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
          status_display: vehicle.status,
          type_display: vehicle.vehicle_type?.name
        })) || null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
}
