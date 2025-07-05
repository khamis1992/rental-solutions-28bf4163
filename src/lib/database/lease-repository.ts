
import { supabase } from '@/lib/supabase';
import { DbTables } from './types';

export interface LeaseFilters {
  status?: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_type?: string;
}

export class LeaseRepository {
  constructor(private client: any) {}

  async findAll(filters?: LeaseFilters): Promise<{ data: DbTables['leases']['Row'][] | null; error: any }> {
    try {
      let query = this.client
        .from('leases')
        .select(`
          *,
          customers:customer_id (
            id,
            full_name,
            email,
            phone_number,
            address,
            city,
            state,
            zip_code
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            license_plate,
            year,
            vin,
            color,
            status
          )
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      if (filters?.agreement_type) {
        query = query.eq('agreement_type', filters.agreement_type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching leases:', error);
      return { data: null, error };
    }
  }

  async findById(id: string): Promise<{ data: DbTables['leases']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('leases')
        .select(`
          *,
          customers:customer_id (
            id,
            full_name,
            email,
            phone_number,
            address,
            city,
            state,
            zip_code,
            driver_license,
            nationality
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            license_plate,
            year,
            vin,
            color,
            status
          )
        `)
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching lease by ID:', error);
      return { data: null, error };
    }
  }

  async create(leaseData: DbTables['leases']['Insert']): Promise<{ data: DbTables['leases']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('leases')
        .insert([leaseData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating lease:', error);
      return { data: null, error };
    }
  }

  async update(id: string, updates: DbTables['leases']['Update']): Promise<{ data: DbTables['leases']['Row'] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('leases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating lease:', error);
      return { data: null, error };
    }
  }

  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.client
        .from('leases')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Error deleting lease:', error);
      return { error };
    }
  }
}

export const leaseRepository = new LeaseRepository(supabase);
export const createLeaseRepository = (client: any) => new LeaseRepository(client);
