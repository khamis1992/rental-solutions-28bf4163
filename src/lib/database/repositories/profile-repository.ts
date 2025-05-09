
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asProfileId } from '../database-types';
import { supabase } from '@/lib/supabase';

type ProfileRow = TableRow<'profiles'>;

/**
 * Repository for customer profile related database operations
 */
export class ProfileRepository extends Repository<'profiles'> {
  constructor(client: any) {
    super(client, 'profiles');
  }

  /**
   * Find active customer profiles
   */
  async findActive(): Promise<DbListResponse<ProfileRow>> {
    const response = await this.client
      .from('profiles')
      .select('*')
      .eq('status', 'active')
      .order('full_name', { ascending: true });
    
    return { data: response.data, error: response.error };
  }

  /**
   * Search profiles by name or other fields
   */
  async search(query: string): Promise<DbListResponse<ProfileRow>> {
    const response = await this.client
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .order('full_name', { ascending: true });
    
    return { data: response.data, error: response.error };
  }
  
  /**
   * Get profile with related leases
   */
  async getWithLeases(profileId: string): Promise<DbSingleResponse<ProfileRow & { leases: any[] }>> {
    const response = await this.client
      .from('profiles')
      .select('*, leases(*)')
      .eq('id', asProfileId(profileId))
      .single();
    
    return { data: response.data, error: response.error };
  }
}

// Export the repository instance and the factory function
export const profileRepository = new ProfileRepository(supabase);
export const createProfileRepository = (client: any) => new ProfileRepository(client);
