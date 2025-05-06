
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asLeaseId, asLeaseStatus } from '../utils';
import { supabase } from '@/lib/supabase';

type LeaseRow = TableRow<'leases'>;

class LeaseRepository extends Repository<'leases'> {
  constructor() {
    super('leases');
  }

  /**
   * Find leases by status
   */
  async findByStatus(status: Tables['leases']['Row']['status']): Promise<DbListResponse<LeaseRow>> {
    const response = await supabase
      .from('leases')
      .select('*, customer:profiles(*), vehicle:vehicles(*)')
      .eq('status', status);
    
    return this.mapDbResponse(response);
  }

  /**
   * Find active leases with details
   */
  async findActiveWithDetails(): Promise<DbListResponse<LeaseRow>> {
    const response = await supabase
      .from('leases')
      .select(`
        *,
        customer:profiles(id, full_name, email, phone_number),
        vehicle:vehicles(id, make, model, year, license_plate)
      `)
      .eq('status', asLeaseStatus('active'));
    
    return this.mapDbResponse(response);
  }

  /**
   * Get leases with payment data
   */
  async getWithPayments(leaseId: string): Promise<DbSingleResponse<LeaseRow & { payments: any[] }>> {
    const response = await supabase
      .from('leases')
      .select(`
        *,
        customer:profiles(id, full_name, email, phone_number),
        vehicle:vehicles(id, make, model, year, license_plate),
        payments:unified_payments(*)
      `)
      .eq('id', asLeaseId(leaseId))
      .single();
    
    return this.mapDbResponse(response);
  }

  /**
   * Update lease status
   */
  async updateStatus(leaseId: string, status: Tables['leases']['Row']['status']): Promise<DbSingleResponse<LeaseRow>> {
    const response = await supabase
      .from('leases')
      .update({ status })
      .eq('id', asLeaseId(leaseId))
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }
}

export const leaseRepository = new LeaseRepository();
