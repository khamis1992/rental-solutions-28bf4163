
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { ServiceResponse } from '@/types/service.types';

export interface PaymentScheduleItem {
  id?: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  description?: string;
  actual_payment_date?: string;
  transaction_id?: string;
  late_fee_applied?: number;
  balance?: number;
}

export class PaymentScheduleService extends BaseService {
  /**
   * Generate and persist payment schedule for an agreement
   */
  async generateAndPersistSchedule(
    agreementId: string,
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    paymentFrequency: string,
    paymentDay: number
  ): Promise<ServiceResponse<PaymentScheduleItem[]>> {
    try {
      // First, clear existing schedule for this agreement
      await this.clearExistingSchedule(agreementId);

      // Generate schedule items
      const scheduleItems = this.generateScheduleItems(
        agreementId,
        startDate,
        endDate,
        rentAmount,
        paymentFrequency,
        paymentDay
      );

      if (scheduleItems.length === 0) {
        return this.success([]);
      }

      // Insert schedule items into payment_schedules table
      const { data, error } = await supabase
        .from('payment_schedules')
        .insert(scheduleItems.map(item => ({
          lease_id: item.lease_id,
          amount: item.amount,
          due_date: item.due_date,
          status: item.status,
          description: item.description
        })))
        .select();

      if (error) {
        return this.handleError(error, 'Failed to persist payment schedule');
      }

      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to generate payment schedule');
    }
  }

  /**
   * Clear existing schedule for an agreement
   */
  private async clearExistingSchedule(agreementId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_schedules')
      .delete()
      .eq('lease_id', agreementId);

    if (error) {
      console.warn('Failed to clear existing schedule:', error);
    }
  }

  /**
   * Generate schedule items based on agreement parameters
   */
  private generateScheduleItems(
    agreementId: string,
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    paymentFrequency: string,
    paymentDay: number
  ): PaymentScheduleItem[] {
    const items: PaymentScheduleItem[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start);
    
    // Set payment day
    if (paymentDay >= 1 && paymentDay <= 31) {
      currentDate.setDate(paymentDay);
      if (currentDate < start) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    // Calculate payment amount based on frequency
    let amount = rentAmount;
    if (paymentFrequency === 'weekly') {
      amount = (rentAmount * 12) / 52;
    } else if (paymentFrequency === 'biweekly') {
      amount = (rentAmount * 12) / 26;
    } else if (paymentFrequency === 'quarterly') {
      amount = rentAmount * 3;
    }
    
    let paymentCount = 0;
    while (currentDate <= end && paymentCount < 100) {
      items.push({
        lease_id: agreementId,
        amount: Math.round(amount * 100) / 100,
        due_date: currentDate.toISOString(),
        status: 'pending',
        description: `${paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1)} payment`
      });
      
      paymentCount++;
      
      // Advance to next payment date
      if (paymentFrequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (paymentFrequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (paymentFrequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (paymentFrequency === 'quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
    }
    
    return items;
  }

  /**
   * Get payment schedule for an agreement
   */
  async getPaymentSchedule(agreementId: string): Promise<ServiceResponse<PaymentScheduleItem[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', agreementId)
        .order('due_date', { ascending: true });

      if (error) {
        return this.handleError(error, 'Failed to fetch payment schedule');
      }

      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch payment schedule');
    }
  }

  /**
   * Update schedule item status when payment is made
   */
  async updateScheduleItemStatus(
    scheduleId: string,
    status: 'completed' | 'overdue' | 'cancelled',
    actualPaymentDate?: string,
    transactionId?: string
  ): Promise<ServiceResponse<PaymentScheduleItem>> {
    try {
      const updateData: any = { status };
      
      if (actualPaymentDate) {
        updateData.actual_payment_date = actualPaymentDate;
      }
      
      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const { data, error } = await supabase
        .from('payment_schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to update schedule item');
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'Failed to update schedule item');
    }
  }

  /**
   * Auto-generate missing payment records for agreements
   */
  async generateMissingPaymentRecords(): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        return this.handleError(error, 'Failed to generate missing payment records');
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'Failed to generate missing payment records');
    }
  }
}

export const paymentScheduleService = new PaymentScheduleService(supabase);
