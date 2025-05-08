
import { supabase } from '@/lib/supabase';
import { DbListResponse, DbSingleResponse, ProfileRow } from '../types';
import { PostgrestError } from '@supabase/supabase-js';
import { asProfileId } from '@/lib/database-common';

// Create a custom repository error type
class RepositoryError implements PostgrestError {
  name: string = 'PostgrestError';
  message: string;
  details: string;
  hint: string;
  code: string;
  
  constructor(message: string) {
    this.message = message;
    this.code = 'CUSTOM_ERROR';
    this.details = message;
    this.hint = '';
  }
}

export class ProfileRepository {
  private client;

  constructor(client: any) {
    this.client = client;
  }

  // Find profile by ID
  async findById(id: string): Promise<DbSingleResponse<ProfileRow>> {
    try {
      const response = await this.client
        .from('profiles')
        .select('*')
        .eq('id', asProfileId(id))
        .single();
        
      return {
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error(`Error fetching profile ${id}:`, error);
      const pgError = new RepositoryError(`Failed to fetch profile: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  }
  
  // Find profiles by role
  async findByRole(role: string): Promise<DbListResponse<ProfileRow>> {
    try {
      const response = await this.client
        .from('profiles')
        .select('*')
        .eq('role', role);
        
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error(`Error fetching profiles with role ${role}:`, error);
      const pgError = new RepositoryError(`Failed to fetch profiles: ${error instanceof Error ? error.message : String(error)}`);
      return { data: [], error: pgError };
    }
  }
  
  // Update profile
  async update(id: string, data: Partial<ProfileRow>): Promise<DbSingleResponse<ProfileRow>> {
    try {
      const response = await this.client
        .from('profiles')
        .update(data)
        .eq('id', asProfileId(id))
        .select()
        .single();
        
      return {
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error(`Error updating profile ${id}:`, error);
      const pgError = new RepositoryError(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  }
  
  // Search profiles by name, email or phone
  async search(query: string): Promise<DbListResponse<ProfileRow>> {
    try {
      const response = await this.client
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(10);
        
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error(`Error searching profiles for "${query}":`, error);
      const pgError = new RepositoryError(`Failed to search profiles: ${error instanceof Error ? error.message : String(error)}`);
      return { data: [], error: pgError };
    }
  }
}

// Export the repository instance and the factory function
export const profileRepository = new ProfileRepository(supabase);
export const createProfileRepository = (client: any) => new ProfileRepository(client);
