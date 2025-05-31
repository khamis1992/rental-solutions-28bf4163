import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Maintenance, MaintenanceFilterParams, MaintenanceStatus, MaintenanceType } from '@/types/maintenance.types';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';
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
        throw this.createServiceError(
          'Failed to fetch maintenance records',
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
        throw this.createServiceError(
          'Failed to fetch maintenance record',
          'getMaintenanceById'
        );
      }

      if (!data) {
        throw createNotFoundError('Maintenance record', id);
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
        throw this.createServiceError(
          'Failed to create maintenance record',
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
        throw this.createServiceError(
          'Failed to update maintenance record',
          'updateMaintenanceRecord'
        );
      }

      if (!data) {
        throw createNotFoundError('Maintenance record', id);
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
        throw this.createServiceError(
          'Failed to delete maintenance record',
          'deleteMaintenanceRecord'
        );
      }

      return true;
    }, 'Failed to delete maintenance record');
  }

  async getMaintenanceByVehicle(vehicleId: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ vehicleId });
  }

  async getMaintenanceByStatus(status: MaintenanceStatus): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ status });
  }

  async getMaintenanceByType(type: MaintenanceType): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ type });
  }

  async getMaintenanceByDateRange(startDate: string, endDate: string): Promise<Result<Maintenance[]>> {
    return this.fetchMaintenanceRecords({ startDate, endDate });
  }

  private async recordExpense(record: Maintenance) {
    await paymentService.recordPayment({
      lease_id: null,
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
