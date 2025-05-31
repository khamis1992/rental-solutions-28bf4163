import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { PaymentStatus } from '@/types/payment-schedule.types';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';

export interface PaymentScheduleFilterParams {
  leaseId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentScheduleItem {
  id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: PaymentStatus;
  description?: string;
  actual_payment_date?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentScheduleCreateData {
  lease_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus;
  description?: string;
  actual_payment_date?: string;
  transaction_id?: string;
}

export interface PaymentScheduleSyncError {
  code: string;
  message: string;
  details?: {
    leaseId?: string;
    scheduleId?: string;
    dueDate?: string;
  };
}

export interface PaymentScheduleSyncResult {
  updated_count: number;
  created_count: number;
  errors: PaymentScheduleSyncError[];
  details?: {
    updated_schedules: string[];
    created_schedules: string[];
    failed_schedules: string[];
  };
}

export class PaymentScheduleService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchPaymentSchedules(filters?: PaymentScheduleFilterParams): Promise<Result<PaymentScheduleItem[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('payment_schedules').select('*');

      if (filters) {
        if (filters.leaseId) {
          query = query.eq('lease_id', filters.leaseId);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.startDate) {
          query = query.gte('due_date', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('due_date', filters.endDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        throw this.createServiceError(
          'Failed to fetch payment schedules',
          'fetchPaymentSchedules'
        );
      }

      return data as PaymentScheduleItem[];
    }, 'Failed to fetch payment schedules');
  }

  async getPaymentScheduleById(id: string): Promise<Result<PaymentScheduleItem>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to fetch payment schedule',
          'getPaymentScheduleById'
        );
      }

      if (!data) {
        throw createNotFoundError('Payment Schedule', id);
      }

      return data;
    }, 'Failed to fetch payment schedule');
  }

  async getPaymentSchedulesByLease(leaseId: string): Promise<Result<PaymentScheduleItem[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: true });

      if (error) {
        throw this.createServiceError(
          'Failed to fetch payment schedules',
          'getPaymentSchedulesByLease'
        );
      }

      return data as PaymentScheduleItem[];
    }, 'Failed to fetch payment schedules');
  }

  async createPaymentSchedule(scheduleData: PaymentScheduleCreateData): Promise<Result<PaymentScheduleItem>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to create payment schedule',
          'createPaymentSchedule'
        );
      }

      return data;
    }, 'Failed to create payment schedule');
  }

  async updatePaymentSchedule(id: string, scheduleData: Partial<PaymentScheduleItem>): Promise<Result<PaymentScheduleItem>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update(scheduleData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update payment schedule',
          'updatePaymentSchedule'
        );
      }

      if (!data) {
        throw createNotFoundError('Payment Schedule', id);
      }

      return data;
    }, 'Failed to update payment schedule');
  }

  async deletePaymentSchedule(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        throw this.createServiceError(
          'Failed to delete payment schedule',
          'deletePaymentSchedule'
        );
      }

      return true;
    }, 'Failed to delete payment schedule');
  }

  async updateScheduleItemStatus(id: string, status: PaymentStatus): Promise<Result<PaymentScheduleItem>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update payment schedule status',
          'updateScheduleItemStatus'
        );
      }

      if (!data) {
        throw createNotFoundError('Payment Schedule', id);
      }

      return data;
    }, 'Failed to update payment schedule status');
  }

  async syncWithPayments(leaseId: string): Promise<Result<PaymentScheduleSyncResult>> {
    return this.safeExecute(async () => {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', leaseId);

      if (paymentsError) {
        throw this.createServiceError(
          'Failed to fetch payments for sync',
          'syncWithPayments'
        );
      }

      const { data: schedules, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', leaseId);

      if (schedulesError) {
        throw this.createServiceError(
          'Failed to fetch payment schedules for sync',
          'syncWithPayments'
        );
      }

      const result: PaymentScheduleSyncResult = {
        updated_count: 0,
        created_count: 0,
        errors: []
      };

      // Process payments and update schedules
      for (const payment of payments || []) {
        try {
          const schedule = schedules?.find((s: PaymentScheduleItem) => s.due_date === payment.payment_date);
          if (schedule) {
            await this.updateScheduleItemStatus(schedule.id, 'paid');
            result.updated_count++;
          }
        } catch (error) {
          result.errors.push({
            code: 'SYNC_ERROR',
            message: `Failed to process payment ${payment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: {
              leaseId: leaseId,
              scheduleId: payment.id,
              dueDate: payment.payment_date
            }
          });
        }
      }

      return result;
    }, 'Failed to sync payment schedules with payments');
  }
}

export const paymentScheduleService = new PaymentScheduleService();
