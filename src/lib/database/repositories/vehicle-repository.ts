
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

/**
 * Repository for interacting with vehicles table
 */
export function createVehicleRepository(supabaseClient: SupabaseClient) {
  return {
    /**
     * Find a vehicle by ID
     */
    findById: async (id: string) => {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching vehicle:', error);
        return null;
      }

      return data as VehicleRow;
    },

    /**
     * Find vehicles by criteria
     */
    findByFilter: async (filter: Partial<VehicleRow>) => {
      let query = supabaseClient.from('vehicles').select('*');

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vehicles by filter:', error);
        return [];
      }

      return data as VehicleRow[];
    },

    /**
     * Create a new vehicle
     */
    create: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        return null;
      }

      return data as VehicleRow;
    },

    /**
     * Update a vehicle
     */
    update: async (id: string, updates: VehicleUpdate) => {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        return null;
      }

      return data as VehicleRow;
    },

    /**
     * Delete a vehicle
     */
    delete: async (id: string) => {
      const { error } = await supabaseClient
        .from('vehicles')
        .delete()
        .eq('id', id);

      return !error;
    }
  };
}

export type VehicleRepository = ReturnType<typeof createVehicleRepository>;
