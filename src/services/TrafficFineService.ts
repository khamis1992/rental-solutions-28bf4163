
import { trafficFineRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { ServiceResponse, wrapOperation } from '@/utils/response-handler';
import { asTrafficFineId, asTrafficFinePaymentStatus } from '@/types/database-common';

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
      const response = await this.repository.findByLeaseId(leaseId);
      
      if (response.error) {
        throw new Error(`Failed to fetch traffic fines: ${response.error.message}`);
      }
      
      return response.data;
    }, 'Finding traffic fines by lease ID');
  }

  /**
   * Find pending traffic fines by lease ID
   */
  async findPendingByLeaseId(leaseId: string): Promise<ServiceResponse<TrafficFine[]>> {
    return wrapOperation(async () => {
      const response = await this.repository.findPendingByLeaseId(leaseId);
      
      if (response.error) {
        throw new Error(`Failed to fetch pending traffic fines: ${response.error.message}`);
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
      
      const response = await this.repository.updatePaymentStatus(safeId, safeStatus);
      
      if (response.error) {
        throw new Error(`Failed to update traffic fine payment status: ${response.error.message}`);
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
      
      const response = await this.repository.reassign(safeId, leaseId);
      
      if (response.error) {
        throw new Error(`Failed to reassign traffic fine: ${response.error.message}`);
      }
      
      return response.data;
    }, 'Reassigning traffic fine');
  }
}

export const trafficFineService = new TrafficFineService();
