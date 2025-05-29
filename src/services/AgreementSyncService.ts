
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { ServiceResponse } from '@/types/service.types';
import { paymentScheduleService } from './PaymentScheduleService';

export class AgreementSyncService extends BaseService {
  /**
   * Fix agreements missing payment frequency and day with defaults
   */
  async fixMissingPaymentDefaults(): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .update({
          payment_frequency: 'monthly',
          payment_day: 1
        })
        .is('payment_frequency', null)
        .select();

      if (error) {
        return this.handleError(error, 'Failed to fix missing payment defaults');
      }

      return this.success({ updated: data?.length || 0 });
    } catch (error) {
      return this.handleError(error, 'Failed to fix missing payment defaults');
    }
  }

  /**
   * Generate payment schedules for active agreements without schedules
   */
  async generateMissingSchedules(): Promise<ServiceResponse<any>> {
    try {
      // Get active agreements without payment schedules
      const { data: agreements, error: agreementError } = await supabase
        .from('leases')
        .select(`
          id,
          start_date,
          end_date,
          rent_amount,
          payment_frequency,
          payment_day,
          status
        `)
        .eq('status', 'active')
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .not('rent_amount', 'is', null);

      if (agreementError) {
        return this.handleError(agreementError, 'Failed to fetch agreements');
      }

      const results = [];
      
      for (const agreement of agreements || []) {
        // Check if schedule already exists
        const scheduleResult = await paymentScheduleService.getPaymentSchedule(agreement.id);
        
        if (scheduleResult.success && scheduleResult.data.length === 0) {
          // Generate schedule for this agreement
          const generateResult = await paymentScheduleService.generateAndPersistSchedule(
            agreement.id,
            new Date(agreement.start_date),
            new Date(agreement.end_date),
            agreement.rent_amount,
            agreement.payment_frequency || 'monthly',
            agreement.payment_day || 1
          );
          
          if (generateResult.success) {
            results.push({
              agreementId: agreement.id,
              scheduleItems: generateResult.data.length
            });
          }
        }
      }

      return this.success({ generated: results });
    } catch (error) {
      return this.handleError(error, 'Failed to generate missing schedules');
    }
  }

  /**
   * Sync payment schedules with actual payments
   */
  async syncScheduleWithPayments(agreementId: string): Promise<ServiceResponse<any>> {
    try {
      // Get payment schedule
      const scheduleResult = await paymentScheduleService.getPaymentSchedule(agreementId);
      if (!scheduleResult.success) {
        return this.handleError(scheduleResult.error, 'Failed to get payment schedule');
      }

      // Get actual payments
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .eq('status', 'completed');

      if (paymentsError) {
        return this.handleError(paymentsError, 'Failed to get payments');
      }

      // Update schedule items that have corresponding payments
      const updates = [];
      
      for (const scheduleItem of scheduleResult.data) {
        const matchingPayment = payments?.find(payment => {
          const paymentMonth = new Date(payment.payment_date || payment.created_at).getMonth();
          const scheduleMonth = new Date(scheduleItem.due_date).getMonth();
          const paymentYear = new Date(payment.payment_date || payment.created_at).getFullYear();
          const scheduleYear = new Date(scheduleItem.due_date).getFullYear();
          
          return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
        });

        if (matchingPayment && scheduleItem.status !== 'completed') {
          const updateResult = await paymentScheduleService.updateScheduleItemStatus(
            scheduleItem.id!,
            'completed',
            matchingPayment.payment_date || matchingPayment.created_at,
            matchingPayment.id
          );
          
          if (updateResult.success) {
            updates.push(scheduleItem.id);
          }
        }
      }

      return this.success({ updated: updates });
    } catch (error) {
      return this.handleError(error, 'Failed to sync schedule with payments');
    }
  }
}

export const agreementSyncService = new AgreementSyncService(supabase);
