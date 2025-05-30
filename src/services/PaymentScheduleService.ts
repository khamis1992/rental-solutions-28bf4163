import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { PaymentSchedule, PaymentScheduleFilterParams, PaymentStatus } from '@/types/payment-schedule.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

export interface PaymentScheduleItem {
  id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'partial' | 'overdue';
  description?: string;
  actual_payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentScheduleCreateData {
  lease_id: string;
  amount: number;
  due_date: string;
  status?: 'pending' | 'completed' | 'partial' | 'overdue';
  description?: string;
}

export interface PaymentScheduleSyncResult {
  updated_count: number;
  created_count: number;
  errors: string[];
}

export class PaymentScheduleService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchPaymentSchedules(filters?: PaymentScheduleFilterParams): Promise<Result<PaymentSchedule[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('payment_schedules').select('*');

      if (filters) {
        if (filters.agreementId) {
          query = query.eq('agreement_id', filters.agreementId);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.startDate && filters.endDate) {
          query = query.gte('due_date', filters.startDate).lte('due_date', filters.endDate);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch payment schedules',
          'PaymentScheduleService',
          'fetchPaymentSchedules'
        );
      }

      return data as PaymentSchedule[];
    }, 'Failed to fetch payment schedules');
  }

  async getPaymentScheduleById(id: string): Promise<Result<PaymentSchedule>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch payment schedule',
          'PaymentScheduleService',
          'getPaymentScheduleById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Payment schedule not found',
          'PaymentScheduleService',
          'getPaymentScheduleById'
        );
      }

      return data;
    }, 'Failed to fetch payment schedule');
  }

  async createPaymentSchedule(scheduleData: Partial<PaymentSchedule>): Promise<Result<PaymentSchedule>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create payment schedule',
          'PaymentScheduleService',
          'createPaymentSchedule'
        );
      }

      return data;
    }, 'Failed to create payment schedule');
  }

  async updatePaymentSchedule(id: string, scheduleData: Partial<PaymentSchedule>): Promise<Result<PaymentSchedule>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update(scheduleData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update payment schedule',
          'PaymentScheduleService',
          'updatePaymentSchedule'
        );
      }

      if (!data) {
        throw createServiceError(
          'Payment schedule not found',
          'PaymentScheduleService',
          'updatePaymentSchedule'
        );
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
        throw createServiceError(
          'Failed to delete payment schedule',
          'PaymentScheduleService',
          'deletePaymentSchedule'
        );
      }

      return true;
    }, 'Failed to delete payment schedule');
  }

  async getPaymentSchedulesByAgreement(agreementId: string): Promise<Result<PaymentSchedule[]>> {
    return this.fetchPaymentSchedules({ agreementId });
  }

  async getPaymentSchedulesByStatus(status: PaymentStatus): Promise<Result<PaymentSchedule[]>> {
    return this.fetchPaymentSchedules({ status });
  }

  async getPaymentSchedulesByDateRange(startDate: string, endDate: string): Promise<Result<PaymentSchedule[]>> {
    return this.fetchPaymentSchedules({ startDate, endDate });
  }

  async getPaymentSchedule(leaseId: string): Promise<Result<PaymentSchedule[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('agreement_id', leaseId)
        .order('due_date', { ascending: true });

      if (error) {
        throw createServiceError(
          'Failed to fetch payment schedule',
          'PaymentScheduleService',
          'getPaymentSchedule'
        );
      }

      return data as PaymentSchedule[];
    }, 'Failed to fetch payment schedule');
  }

  async calculateTotalAmount(payments: PaymentSchedule[]): Promise<number> {
    return payments.reduce((sum: number, p: PaymentSchedule) => sum + p.amount, 0);
  }

  async getScheduleByLeaseId(leaseId: string): Promise<Result<PaymentSchedule[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('agreement_id', leaseId)
        .order('due_date', { ascending: true });

      if (error) {
        throw createServiceError(
          'Failed to fetch payment schedule',
          'PaymentScheduleService',
          'getScheduleByLeaseId'
        );
      }

      return data as PaymentSchedule[];
    }, 'Failed to fetch payment schedule');
  }

  async generateAndPersistSchedule(
    leaseId: string,
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    paymentFrequency: string,
    paymentDay: number
  ) {
    return this.safeExecute(async () => {
      const scheduleItems: PaymentScheduleCreateData[] = [];
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const dueDate = new Date(current.getFullYear(), current.getMonth(), paymentDay);
        
        scheduleItems.push({
          lease_id: leaseId,
          amount: rentAmount,
          due_date: dueDate.toISOString(),
          status: 'pending',
          description: `Payment for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        });

        current.setMonth(current.getMonth() + 1);
      }

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert(scheduleItems)
        .select();

      if (error) throw error;
      return data || [];
    }, 'Failed to generate payment schedule');
  }

  async updateScheduleItemStatus(
    scheduleId: string,
    status: 'completed' | 'overdue' | 'cancelled',
    actualPaymentDate?: string,
    transactionId?: string
  ) {
    return this.safeExecute(async () => {
      const updates: any = { status };
      if (actualPaymentDate) updates.actual_payment_date = actualPaymentDate;

      const { data, error } = await supabase
        .from('payment_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'Failed to update schedule item status');
  }

  async createScheduleItem(scheduleData: PaymentScheduleCreateData) {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'Failed to create payment schedule item');
  }

  async updateScheduleItem(id: string, updates: Partial<PaymentScheduleCreateData>) {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'Failed to update payment schedule item');
  }

  async deleteScheduleItem(id: string) {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }, 'Failed to delete payment schedule item');
  }

  async syncWithPayments(leaseId: string) {
    return this.safeExecute(async () => {
      // Get all payment schedules for the lease
      const { data: schedules, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', leaseId);

      if (scheduleError) throw scheduleError;

      // Get all payments for the lease
      const { data: payments, error: paymentError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId);

      if (paymentError) throw paymentError;

      let updatedCount = 0;
      const errors: string[] = [];

      // Match payments to schedules by month/year
      for (const schedule of schedules || []) {
        const scheduleDate = new Date(schedule.due_date);
        const scheduleMonth = scheduleDate.getMonth();
        const scheduleYear = scheduleDate.getFullYear();

        // Find matching payments
        const matchingPayments = (payments || []).filter(payment => {
          const paymentDate = new Date(payment.payment_date || payment.created_at);
          return paymentDate.getMonth() === scheduleMonth && 
                 paymentDate.getFullYear() === scheduleYear;
        });

        // Update schedule status based on payments
        let newStatus = schedule.status;
        let actualPaymentDate = schedule.actual_payment_date;

        if (matchingPayments.length > 0) {
          const totalPaid = matchingPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
          
          if (totalPaid >= schedule.amount) {
            newStatus = 'completed';
            actualPaymentDate = matchingPayments[0].payment_date;
          } else if (totalPaid > 0) {
            newStatus = 'partial';
            actualPaymentDate = matchingPayments[0].payment_date;
          }
        }

        // Update if status changed
        if (newStatus !== schedule.status || actualPaymentDate !== schedule.actual_payment_date) {
          try {
            const { error: updateError } = await supabase
              .from('payment_schedules')
              .update({ 
                status: newStatus,
                actual_payment_date: actualPaymentDate
              })
              .eq('id', schedule.id);

            if (updateError) {
              errors.push(`Failed to update schedule ${schedule.id}: ${updateError.message}`);
            } else {
              updatedCount++;
            }
          } catch (error) {
            errors.push(`Error updating schedule ${schedule.id}: ${error}`);
          }
        }
      }

      return {
        updated_count: updatedCount,
        created_count: 0,
        errors
      } as PaymentScheduleSyncResult;
    }, 'Failed to sync payment schedule with payments');
  }

  async generateMissingPaymentRecords() {
    return this.safeExecute(async () => {
      // Call the database function to generate missing payment records
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) throw error;
      
      return {
        generated_count: Array.isArray(data) ? data.length : 0,
        records: data || []
      };
    }, 'Failed to generate missing payment records');
  }
}

export const paymentScheduleService = new PaymentScheduleService();
