import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Agreement, AgreementFilterParams, AgreementStatus } from '@/types/agreement.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

export class LeaseService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchLeases(filters?: AgreementFilterParams): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('leases').select('*');

      if (filters) {
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.startDate && filters.endDate) {
          query = query.gte('start_date', filters.startDate).lte('end_date', filters.endDate);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch leases',
          'LeaseService',
          'fetchLeases'
        );
      }

      return data as Agreement[];
    }, 'Failed to fetch leases');
  }

  async getLeaseById(id: string): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch lease',
          'LeaseService',
          'getLeaseById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Lease not found',
          'LeaseService',
          'getLeaseById'
        );
      }

      return data;
    }, 'Failed to fetch lease');
  }

  async createLease(leaseData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .insert([leaseData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create lease',
          'LeaseService',
          'createLease'
        );
      }

      return data;
    }, 'Failed to create lease');
  }

  async updateLease(id: string, leaseData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .update(leaseData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update lease',
          'LeaseService',
          'updateLease'
        );
      }

      if (!data) {
        throw createServiceError(
          'Lease not found',
          'LeaseService',
          'updateLease'
        );
      }

      return data;
    }, 'Failed to update lease');
  }

  async deleteLease(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete lease',
          'LeaseService',
          'deleteLease'
        );
      }

      return true;
    }, 'Failed to delete lease');
  }

  async getLeasesByCustomer(customerId: string): Promise<Result<Agreement[]>> {
    return this.fetchLeases({ customerId });
  }

  async getLeasesByVehicle(vehicleId: string): Promise<Result<Agreement[]>> {
    return this.fetchLeases({ vehicleId });
  }

  async getLeasesByStatus(status: AgreementStatus): Promise<Result<Agreement[]>> {
    return this.fetchLeases({ status });
  }

  async getLeasesByDateRange(startDate: string, endDate: string): Promise<Result<Agreement[]>> {
    return this.fetchLeases({ startDate, endDate });
  }
} 