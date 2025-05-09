
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Repository for interacting with profiles table
 */
export function createProfileRepository(supabaseClient: SupabaseClient) {
  return {
    /**
     * Find a profile by ID
     */
    findById: async (id: string) => {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as ProfileRow;
    },

    /**
     * Find profiles by criteria
     */
    findByFilter: async (filter: Partial<ProfileRow>) => {
      let query = supabaseClient.from('profiles').select('*');

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles by filter:', error);
        return [];
      }

      return data as ProfileRow[];
    },

    /**
     * Create a new profile
     */
    create: async (profile: ProfileInsert) => {
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data as ProfileRow;
    },

    /**
     * Update a profile
     */
    update: async (id: string, updates: ProfileUpdate) => {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data as ProfileRow;
    },

    /**
     * Delete a profile
     */
    delete: async (id: string) => {
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', id);

      return !error;
    }
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
