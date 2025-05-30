import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Maintenance, MaintenanceFilterParams } from '@/types/maintenance.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';
import { paymentService } from './PaymentService';

export class MaintenanceService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchMaintenanceRecords(filters?: MaintenanceFilterParams): Promise<Result<Maintenance[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('maintenance').select('*');

      if (filters) {
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        
        if (filters.startDate && filters.endDate) {
          query = query.gte('date', filters.startDate).lte('date', filters.endDate);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch maintenance records',
          'MaintenanceService',
          'fetchMaintenanceRecords'
        );
      }

      return data as Maintenance[];
    }, 'Failed to fetch maintenance records');
  }

  async getMaintenanceById(id: string): Promise<Result<Maintenance>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch maintenance record',
          'MaintenanceService',
          'getMaintenanceById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Maintenance record not found',
          'MaintenanceService',
          'getMaintenanceById'
        );
      }

      return data;
    }, 'Failed to fetch maintenance record');
  }

  async createMaintenanceRecord(maintenanceData: Partial<Maintenance>): Promise<Result<Maintenance>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert([maintenanceData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create maintenance record',
          'MaintenanceService',
          'createMaintenanceRecord'
        );
      }

      return data;
    }, 'Failed to create maintenance record');
  }

  async updateMaintenanceRecord(id: string, maintenanceData: Partial<Maintenance>): Promise<Result<Maintenance>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .update(maintenanceData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update maintenance record',
          'MaintenanceService',
          'updateMaintenanceRecord'
        );
      }

      if (!data) {
        throw createServiceError(
          'Maintenance record not found',
          'MaintenanceService',
          'updateMaintenanceRecord'
        );
      }

      return data;
    }, 'Failed to update maintenance record');
  }

  async deleteMaintenanceRecord(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete maintenance record',
          'MaintenanceService',
          'deleteMaintenanceRecord'
        );
      }

      return true;
    }, 'Failed to delete maintenance record');
  }

  async getMaintenanceByVehicle(vehicleId: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ vehicleId });
  }

  async getMaintenanceByStatus(status: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ status });
  }

  async getMaintenanceByType(type: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ type });
  }

  async getMaintenanceByDateRange(startDate: string, endDate: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ startDate, endDate });
  }

  private async recordExpense(record: Maintenance) {
    await paymentService.recordPayment({
      lease_id: null, // Remove agreement_id reference since it doesn't exist in the maintenance table
      amount: record.cost ?? 0,
      payment_date: new Date().toISOString(),
      description: `Maintenance expense for vehicle ${record.vehicle_id}`,
      status: 'completed',
      type: 'Expense',
      payment_method: 'internal'
    } as any);
  }
}

export const maintenanceService = new MaintenanceService();
