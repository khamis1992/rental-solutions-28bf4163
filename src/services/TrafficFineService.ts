
import { trafficFineRepository } from '@/lib/database';
import { BaseService, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { ServiceResponse, wrapOperation } from '@/utils/response-handler';
import { asTrafficFineId, asTrafficFinePaymentStatus } from '@/types/database-common';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('service:traffic-fine');

export type TrafficFine = TableRow<'traffic_fines'>;

/**
 * Service responsible for managing traffic fine operations
 */
export class TrafficFineService extends BaseService<'traffic_fines'> {
  constructor() {
    super(trafficFineRepository);
  }

  /**
   * Find traffic fines by lease ID
   */
  async findByLeaseId(leaseId: string): Promise<ServiceResponse<TrafficFine[]>> {
    return wrapOperation(async () => {
      logger.debug(`Finding traffic fines by lease ID: ${leaseId}`);
      
      const response = await this.repository.findByLeaseId(leaseId);
      
      if (response.error) {
        const errorMsg = `Failed to fetch traffic fines: ${response.error.message}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      return response.data;
    }, 'Finding traffic fines by lease ID');
  }

  /**
   * Find pending traffic fines by lease ID
   */
  async findPendingByLeaseId(leaseId: string): Promise<ServiceResponse<TrafficFine[]>> {
    return wrapOperation(async () => {
      logger.debug(`Finding pending traffic fines by lease ID: ${leaseId}`);
      
      const response = await this.repository.findPendingByLeaseId(leaseId);
      
      if (response.error) {
        const errorMsg = `Failed to fetch pending traffic fines: ${response.error.message}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      return response.data;
    }, 'Finding pending traffic fines by lease ID');
  }

  /**
   * Update traffic fine payment status
   */
  async updatePaymentStatus(fineId: string, status: string): Promise<ServiceResponse<TrafficFine>> {
    return wrapOperation(async () => {
      const safeId = asTrafficFineId(fineId);
      const safeStatus = asTrafficFinePaymentStatus(status);
      
      logger.debug(`Updating traffic fine payment status: ${safeId} to ${safeStatus}`);
      
      const response = await this.repository.updatePaymentStatus(safeId, safeStatus);
      
      if (response.error) {
        const errorMsg = `Failed to update traffic fine payment status: ${response.error.message}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      return response.data;
    }, 'Updating traffic fine payment status');
  }

  /**
   * Reassign traffic fine to a different lease
   */
  async reassign(fineId: string, leaseId: string | null): Promise<ServiceResponse<TrafficFine>> {
    return wrapOperation(async () => {
      const safeId = asTrafficFineId(fineId);
      
      logger.debug(`Reassigning traffic fine ${safeId} to lease ${leaseId || 'none'}`);
      
      const response = await this.repository.reassign(safeId, leaseId);
      
      if (response.error) {
        const errorMsg = `Failed to reassign traffic fine: ${response.error.message}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      return response.data;
    }, 'Reassigning traffic fine');
  }

  /**
   * Batch update payment status for multiple fines
   */
  async batchUpdatePaymentStatus(
    fineIds: string[], 
    status: string
  ): Promise<ServiceResponse<{
    updated: number;
    total: number;
    errors: any[];
  }>> {
    return wrapOperation(async () => {
      logger.debug(`Batch updating ${fineIds.length} traffic fines to status ${status}`);
      
      const safeStatus = asTrafficFinePaymentStatus(status);
      const result = await (this.repository as any).batchUpdatePaymentStatus(fineIds, safeStatus);
      
      if (!result.success && result.errors.length > 0) {
        logger.warn(`Batch update completed with ${result.errors.length} errors`);
      }
      
      return {
        updated: result.updated,
        total: fineIds.length,
        errors: result.errors
      };
    }, 'Batch updating traffic fine payment status');
  }
}

export const trafficFineService = new TrafficFineService();
