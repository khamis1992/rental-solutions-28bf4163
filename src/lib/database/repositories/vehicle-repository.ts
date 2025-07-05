
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createVehicleRepository(supabase: SupabaseClient<Database>) {
  return {
    async findAll() {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        return { data, error };
      } catch (error) {
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async findById(id: string) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single();

        return { data, error };
      } catch (error) {
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async create(vehicle: any) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .insert([vehicle])
          .select()
          .single();

        return { data, error };
      } catch (error) {
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async update(id: string, updates: any) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      } catch (error) {
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async delete(id: string) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id);

        return { data: { success: true }, error };
      } catch (error) {
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    }
  };
}
