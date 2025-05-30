
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { ServiceResponse } from '@/types/service.types';
import { Database } from '@/types/database.types';

export type PaymentScheduleStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export interface PaymentScheduleItem {
  id?: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: PaymentScheduleStatus;
  description?: string | null;
  actual_payment_date?: string | null;
  transaction_id?: string | null;
  late_fee_applied?: number | null;
  balance?: number | null;
  created_at?: string;
  updated_at?: string;
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
      console.log(`Generating payment schedule for agreement ${agreementId}`, {
        startDate,
        endDate,
        rentAmount,
        paymentFrequency,
        paymentDay
      });

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
        console.log('No schedule items generated');
        return this.success([]);
      }

      console.log(`Generated ${scheduleItems.length} schedule items`);

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
        console.error('Failed to insert payment schedule:', error);
        return this.handleError(error, 'Failed to persist payment schedule');
      }

      console.log(`Successfully persisted ${data?.length || 0} payment schedule items`);
      return this.success(data || []);
    } catch (error) {
      console.error('Error in generateAndPersistSchedule:', error);
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
    } else {
      console.log(`Cleared existing schedule for agreement ${agreementId}`);
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
    
    console.log('Generating schedule items with parameters:', {
      agreementId,
      start: start.toISOString(),
      end: end.toISOString(),
      rentAmount,
      paymentFrequency,
      paymentDay
    });
    
    let currentDate = new Date(start);
    
    // Set payment day - ensure it's valid for the first month
    if (paymentDay >= 1 && paymentDay <= 31) {
      currentDate.setDate(paymentDay);
      // If the payment day has already passed in the start month, move to next month
      if (currentDate < start) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(paymentDay);
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
    const maxPayments = 100; // Safety limit
    
    while (currentDate <= end && paymentCount < maxPayments) {
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      items.push({
        lease_id: agreementId,
        amount: Math.round(amount * 100) / 100,
        due_date: currentDate.toISOString(),
        status: 'pending',
        description: `${paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1)} payment - ${monthName}`
      });
      
      paymentCount++;
      
      // Advance to next payment date
      const nextDate = new Date(currentDate);
      if (paymentFrequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (paymentFrequency === 'biweekly') {
        nextDate.setDate(nextDate.getDate() + 14);
      } else if (paymentFrequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Handle month-end edge cases
        if (nextDate.getDate() !== paymentDay) {
          // Adjust for months with fewer days
          nextDate.setDate(Math.min(paymentDay, this.getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
        }
      } else if (paymentFrequency === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
        if (nextDate.getDate() !== paymentDay) {
          // Adjust for months with fewer days
          nextDate.setDate(Math.min(paymentDay, this.getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
        }
      }
      
      currentDate = nextDate;
    }
    
    console.log(`Generated ${items.length} payment schedule items`);
    return items;
  }

  /**
   * Helper method to get the number of days in a month
   */
  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
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
  
  /**
   * Sync payment schedule with actual payments
   */
  async syncWithPayments(agreementId: string): Promise<ServiceResponse<any>> {
    try {
      console.log(`Synchronizing payment schedule with actual payments for agreement ${agreementId}`);
      
      // Get all payments for this agreement
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('payment_date', { ascending: true });
      
      if (paymentsError) {
        return this.handleError(paymentsError, 'Failed to fetch payments for sync');
      }
      
      // Get payment schedule
      const { data: scheduleItems, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', agreementId)
        .order('due_date', { ascending: true });
        
      if (scheduleError) {
        return this.handleError(scheduleError, 'Failed to fetch payment schedule for sync');
      }
      
      // Process payments and update schedule
      let updatedItems = 0;
      
      for (const payment of (payments || [])) {
        if (!payment.payment_date) continue;
        
        // Find matching schedule item by month/year
        const paymentDate = new Date(payment.payment_date);
        const matchingItem = (scheduleItems || []).find(item => {
          const dueDate = new Date(item.due_date);
          return dueDate.getMonth() === paymentDate.getMonth() && 
                 dueDate.getFullYear() === paymentDate.getFullYear();
        });
        
        if (matchingItem) {
          // Update the schedule item
          const { error } = await supabase
            .from('payment_schedules')
            .update({
              status: payment.status === 'completed' ? 'completed' : 'pending',
              actual_payment_date: payment.payment_date,
              transaction_id: payment.id
            })
            .eq('id', matchingItem.id);
            
          if (!error) {
            updatedItems++;
          }
        }
      }
      
      return this.success({
        message: `Synchronized payment schedule with ${updatedItems} actual payments`,
        updated_count: updatedItems
      });
    } catch (error) {
      return this.handleError(error, 'Failed to synchronize payment schedule');
    }
  }
}

export const paymentScheduleService = new PaymentScheduleService(supabase);
