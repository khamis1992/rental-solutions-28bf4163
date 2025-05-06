
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asProfileId, asProfileStatus } from '../utils';
import { supabase } from '@/lib/supabase';

type ProfileRow = TableRow<'profiles'>;

class ProfileRepository extends Repository<'profiles'> {
  constructor() {
    super('profiles');
  }

  /**
   * Find profiles by role
   */
  async findByRole(role: string): Promise<DbListResponse<ProfileRow>> {
    const response = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role);
    
    return this.mapDbResponse(response);
  }

  /**
   * Find customers
   */
  async findCustomers(): Promise<DbListResponse<ProfileRow>> {
    return this.findByRole('customer');
  }

  /**
   * Find customer with agreements
   */
  async findCustomerWithAgreements(customerId: string): Promise<DbSingleResponse<ProfileRow & { agreements: any[] }>> {
    const response = await supabase
      .from('profiles')
      .select(`
        *,
        agreements:leases(*)
      `)
      .eq('id', asProfileId(customerId))
      .eq('role', 'customer')
      .single();
    
    return this.mapDbResponse(response);
  }

  /**
   * Update profile status
   */
  async updateStatus(profileId: string, status: Tables['profiles']['Row']['status']): Promise<DbSingleResponse<ProfileRow>> {
    const response = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', asProfileId(profileId))
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }
  
  /**
   * Update profile role
   */
  async updateRole(profileId: string, role: string): Promise<DbSingleResponse<ProfileRow>> {
    const response = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', asProfileId(profileId))
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }
}

export const profileRepository = new ProfileRepository();
