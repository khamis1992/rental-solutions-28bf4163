
import { supabase } from '@/lib/supabase';
import { DbTables } from '../types';
import { asProfileId } from '../database-types';

export interface ProfileFilters {
  role?: string;
  email?: string;
  full_name?: string;
}

export class ProfileRepository {
  constructor(private client: any) {}

  async findAll(filters?: ProfileFilters): Promise<{ data: DbTables['profiles']['Row'][] | null; error: any }> {
    try {
      let query = this.client.from('profiles').select('*');
      
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      if (filters?.full_name) {
        query = query.ilike('full_name', `%${filters.full_name}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return { data: null, error };
    }
  }

  async findById(id: string): Promise<{ data: DbTables['profiles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      return { data: null, error };
    }
  }

  async create(profileData: DbTables['profiles']['Insert']): Promise<{ data: DbTables['profiles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error };
    }
  }

  async update(id: string, updates: DbTables['profiles']['Update']): Promise<{ data: DbTables['profiles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }

  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.client
        .from('profiles')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { error };
    }
  }

  async findByEmail(email: string): Promise<{ data: DbTables['profiles']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      return { data: null, error };
    }
  }

  async findCustomers(): Promise<{ data: DbTables['profiles']['Row'][] | null; error: any }> {
    return this.findAll({ role: 'customer' });
  }
}

export const profileRepository = new ProfileRepository(supabase);
export const createProfileRepository = (client: any) => new ProfileRepository(client);
