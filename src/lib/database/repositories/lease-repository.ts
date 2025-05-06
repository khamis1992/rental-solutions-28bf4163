
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asLeaseId, asLeaseStatus } from '../database-types';
import { supabase } from '@/lib/supabase';

type LeaseRow = TableRow<'leases'>;

/**
 * Repository for lease-related database operations
 */
export class LeaseRepository extends Repository<'leases'> {
  constructor(client: any) {
    super(client, 'leases');
  }

  /**
   * Find leases by status
   */
  async findByStatus(status: Tables['leases']['Row']['status']): Promise<DbListResponse<LeaseRow>> {
    const response = await this.client
      .from('leases')
      .select('*, customer:profiles(*), vehicle:vehicles(*)')
      .eq('status', status);
    
    return { data: response.data, error: response.error };
  }

  /**
   * Find active leases with details
   */
  async findActiveWithDetails(): Promise<DbListResponse<LeaseRow>> {
    const response = await this.client
      .from('leases')
      .select(`
        *,
        customer:profiles(id, full_name, email, phone_number),
        vehicle:vehicles(id, make, model, year, license_plate)
      `)
      .eq('status', asLeaseStatus('active'));
    
    return { data: response.data, error: response.error };
  }

  /**
   * Get leases with payment data
   */
  async getWithPayments(leaseId: string): Promise<DbSingleResponse<LeaseRow & { payments: any[] }>> {
    const response = await this.client
      .from('leases')
      .select(`
        *,
        customer:profiles(id, full_name, email, phone_number),
        vehicle:vehicles(id, make, model, year, license_plate),
        payments:unified_payments(*)
      `)
      .eq('id', asLeaseId(leaseId))
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update lease status
   */
  async updateStatus(leaseId: string, status: Tables['leases']['Row']['status']): Promise<DbSingleResponse<LeaseRow>> {
    const response = await this.client
      .from('leases')
      .update({ status })
      .eq('id', asLeaseId(leaseId))
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }
}

// Export the repository instance and the factory function
export const leaseRepository = new LeaseRepository(supabase);
export const createLeaseRepository = (client: any) => new LeaseRepository(client);
