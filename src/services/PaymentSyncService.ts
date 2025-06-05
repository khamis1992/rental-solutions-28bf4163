
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/error.types';
import { paymentScheduleService } from './PaymentScheduleService';

interface FixResult {
  agreementId: string;
  syncCompleted: boolean;
  scheduleExists: boolean;
  scheduleItems: number;
}

/**
 * Simplified Payment Synchronization Service
 * Focuses on fixing payment schedule generation and synchronization
 */
export class PaymentSyncService extends BaseService {
  
  /**
   * Fix specific agreement payment synchronization issue
   */
  async fixAgreementPaymentSync(agreementId: string): Promise<Result<FixResult>> {
    try {
      console.log(`[PaymentSync] Starting fix for agreement ${agreementId}`);
      
      // Step 1: Get agreement details
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError || !agreement) {
        console.error(`[PaymentSync] Agreement not found:`, agreementError);
        return this.error(agreementError, 'Agreement not found');
      }

      console.log(`[PaymentSync] Agreement found: ${agreement.agreement_number}`);

      // Step 2: Check if payment schedule exists
      const scheduleResult = await paymentScheduleService.getPaymentSchedule(agreementId);
      
      if (!scheduleResult.success) {
        console.error(`[PaymentSync] Failed to get schedule:`, scheduleResult.error);
        return this.error(scheduleResult.error, 'Failed to get payment schedule');
      }

      let scheduleItems = scheduleResult.data.length;

      // Step 3: Generate payment schedule if missing and agreement is active
      if (scheduleItems === 0 && agreement.status === 'active') {
        console.log(`[PaymentSync] Generating payment schedule for agreement ${agreementId}`);
        
        // Set defaults if missing
        const rentAmount = agreement.rent_amount || 0;
        const startDate = new Date(agreement.start_date);
        const endDate = new Date(agreement.end_date);
        const paymentFrequency = agreement.payment_frequency || 'monthly';
        const paymentDay = agreement.payment_day || agreement.rent_due_day || 1;

        if (rentAmount > 0 && startDate && endDate) {
          const generateResult = await paymentScheduleService.generateAndPersistSchedule(
            agreementId,
            startDate,
            endDate,
            rentAmount,
            paymentFrequency,
            paymentDay
          );

          if (generateResult.success) {
            scheduleItems = generateResult.data.length;
            console.log(`[PaymentSync] Generated ${scheduleItems} schedule items`);
          } else {
            console.error(`[PaymentSync] Failed to generate schedule:`, generateResult.error);
          }
        } else {
          console.warn(`[PaymentSync] Missing required data for schedule generation`);
        }
      }

      // Step 4: Generate missing payment records
      try {
        await paymentScheduleService.generateMissingPaymentRecords();
        console.log(`[PaymentSync] Generated missing payment records`);
      } catch (error) {
        console.warn(`[PaymentSync] Failed to generate missing payment records:`, error);
      }

      const result: FixResult = {
        agreementId,
        syncCompleted: true,
        scheduleExists: scheduleItems > 0,
        scheduleItems
      };

      console.log(`[PaymentSync] Fix completed:`, result);
      return this.success(result);
    } catch (error) {
      console.error(`[PaymentSync] Failed to fix agreement payment sync:`, error);
      return this.error(error, 'Failed to fix agreement payment sync');
    }
  }
}

export const paymentSyncService = new PaymentSyncService(supabase);
