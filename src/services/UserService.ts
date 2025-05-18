import { createClient } from '@supabase/supabase-js';
import { Tables } from '@/lib/database/types';
import { supabase } from '@/lib/supabase';
import { handleServiceOperation, ServiceResult } from './base/BaseService';

/**
 * Service for managing user accounts and roles
 */
export class UserService {
  /**
   * Update a user's role using service role key when available
   */
  async updateRole(id: string, role: Tables['profiles']['Row']['role']): Promise<ServiceResult<Tables['profiles']['Row']>> {
    return handleServiceOperation(async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      const client = serviceKey
        ? createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          })
        : supabase;

      const { data, error } = await client
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Tables['profiles']['Row'];
    });
  }
}

export const userService = new UserService();
