
import { Repository } from '../repository';
import { DbSingleResponse, DbListResponse, TrafficFineRow } from '../types';
import { supabase } from '@/lib/supabase';
import { asTrafficFineId, asTrafficFinePaymentStatus } from '@/types/database-common';
import { mapDbResponse } from '../utils';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('db:traffic-fine-repository');

class TrafficFineRepository extends Repository<'traffic_fines'> {
  constructor() {
    super('traffic_fines');
  }

  /**
   * Find traffic fines by lease ID
   */
  async findByLeaseId(leaseId: string): Promise<DbListResponse<TrafficFineRow>> {
    logger.debug(`Finding traffic fines for lease ID: ${leaseId}`);
    
    const response = await supabase
      .from(this.tableName)
      .select('*')
      .eq('lease_id', leaseId)
      .order('violation_date', { ascending: false });
    
    if (response.error) {
      logger.error(`Error finding traffic fines for lease: ${response.error.message}`);
    } else {
      logger.debug(`Found ${response.data?.length || 0} traffic fines for lease ${leaseId}`);
    }
    
    return mapDbResponse(response);
  }

  /**
   * Find pending traffic fines by lease ID
   */
  async findPendingByLeaseId(leaseId: string): Promise<DbListResponse<TrafficFineRow>> {
    logger.debug(`Finding pending traffic fines for lease ID: ${leaseId}`);
    
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
    
    logger.debug(`Updating fine ${safeId} payment status to ${safeStatus}`);
    
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
    
    if (response.error) {
      logger.error(`Error updating payment status: ${response.error.message}`);
    } else {
      logger.debug(`Successfully updated payment status for fine ${safeId}`);
    }
    
    return mapDbResponse(response);
  }

  /**
   * Reassign traffic fine to a different lease
   */
  async reassign(fineId: string, leaseId: string | null): Promise<DbSingleResponse<TrafficFineRow>> {
    const safeId = asTrafficFineId(fineId);
    
    logger.debug(`Reassigning fine ${safeId} to lease ${leaseId || 'none'}`);
    
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
    
    if (response.error) {
      logger.error(`Error reassigning fine: ${response.error.message}`);
    }
    
    return mapDbResponse(response);
  }

  /**
   * Batch update payment status for multiple fines
   */
  async batchUpdatePaymentStatus(
    fineIds: string[], 
    status: string
  ): Promise<{ success: boolean; updated: number; errors: any[] }> {
    try {
      logger.debug(`Batch updating ${fineIds.length} fines to status: ${status}`);
      
      const safeStatus = asTrafficFinePaymentStatus(status);
      const updateData = { 
        payment_status: safeStatus,
        updated_at: new Date()
      };
      
      // Add payment date if status is 'paid'
      if (safeStatus === 'paid') {
        Object.assign(updateData, { payment_date: new Date() });
      }
      
      // Supabase currently doesn't support bulk updates with individual responses
      // Process updates in smaller batches
      const batchSize = 10;
      const results = [];
      const errors = [];
      
      for (let i = 0; i < fineIds.length; i += batchSize) {
        const batch = fineIds.slice(i, i + batchSize);
        
        for (const id of batch) {
          try {
            const { error } = await supabase
              .from(this.tableName)
              .update(updateData)
              .eq('id', id);
              
            if (error) {
              logger.error(`Error updating fine ${id}: ${error.message}`);
              errors.push({ id, error: error.message });
            } else {
              results.push(id);
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Exception updating fine ${id}: ${errorMessage}`);
            errors.push({ id, error: errorMessage });
          }
        }
      }
      
      logger.info(`Batch update completed: ${results.length} updated, ${errors.length} errors`);
      
      return {
        success: errors.length === 0,
        updated: results.length,
        errors
      };
    } catch (error) {
      logger.error(`Batch update failed:`, error);
      
      return {
        success: false,
        updated: 0,
        errors: [error]
      };
    }
  }
}

export const trafficFineRepository = new TrafficFineRepository();
