
import { Repository } from '../repository';
import { DbSingleResponse, DbListResponse, TrafficFineRow } from '../types';
import { supabase } from '@/lib/supabase';
import { asTrafficFineId, asTrafficFinePaymentStatus } from '@/types/database-common';
import { mapDbResponse } from '../utils';

class TrafficFineRepository extends Repository<'traffic_fines'> {
  constructor() {
    super('traffic_fines');
  }

  /**
   * Find traffic fines by lease ID
   */
  async findByLeaseId(leaseId: string): Promise<DbListResponse<TrafficFineRow>> {
    const response = await supabase
      .from(this.tableName)
      .select('*')
      .eq('lease_id', leaseId)
      .order('violation_date', { ascending: false });
    
    return mapDbResponse(response);
  }

  /**
   * Find pending traffic fines by lease ID
   */
  async findPendingByLeaseId(leaseId: string): Promise<DbListResponse<TrafficFineRow>> {
    const response = await supabase
      .from(this.tableName)
      .select('*')
      .eq('lease_id', leaseId)
      .eq('payment_status', 'pending')
      .order('violation_date', { ascending: false });
    
    return mapDbResponse(response);
  }

  /**
   * Update traffic fine payment status
   */
  async updatePaymentStatus(fineId: string, status: string): Promise<DbSingleResponse<TrafficFineRow>> {
    const safeId = asTrafficFineId(fineId);
    const safeStatus = asTrafficFinePaymentStatus(status);
    
    const updateData = { 
      payment_status: safeStatus,
      updated_at: new Date()
    };
    
    // Add payment date if status is 'paid'
    if (safeStatus === 'paid') {
      Object.assign(updateData, { payment_date: new Date() });
    }
    
    const response = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', safeId)
      .select()
      .single();
    
    return mapDbResponse(response);
  }

  /**
   * Reassign traffic fine to a different lease
   */
  async reassign(fineId: string, leaseId: string | null): Promise<DbSingleResponse<TrafficFineRow>> {
    const safeId = asTrafficFineId(fineId);
    
    const response = await supabase
      .from(this.tableName)
      .update({ 
        lease_id: leaseId,
        assignment_status: leaseId ? 'assigned' : 'pending',
        updated_at: new Date()
      })
      .eq('id', safeId)
      .select()
      .single();
    
    return mapDbResponse(response);
  }
}

export const trafficFineRepository = new TrafficFineRepository();
