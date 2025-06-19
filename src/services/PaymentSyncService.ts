
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/error.types';
import { paymentScheduleService } from './PaymentScheduleService';
import { paymentScheduleSyncService } from './PaymentScheduleSyncService';

interface FixResult {
  agreementId: string;
  syncCompleted: boolean;
  scheduleExists: boolean;
  scheduleItems: number;
  unifiedPaymentsCreated: number;
}

/**
 * Enhanced Payment Synchronization Service
 * Focuses on fixing payment schedule generation and synchronization with unified_payments
 */
export class PaymentSyncService extends BaseService {
  
  /**
   * Fix specific agreement payment synchronization issue
   */
  async fixAgreementPaymentSync(agreementId: string): Promise<Result<FixResult>> {
    try {
      console.log(`[PaymentSync] Starting comprehensive fix for agreement ${agreementId}`);
      
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

      // Step 4: Sync payment schedule with unified_payments table
      let unifiedPaymentsCreated = 0;
      if (scheduleItems > 0) {
        console.log(`[PaymentSync] Syncing ${scheduleItems} schedule items with unified_payments`);
        
        const syncResult = await paymentScheduleSyncService.checkPaymentScheduleSync(agreementId);
        if (syncResult.success) {
          unifiedPaymentsCreated = syncResult.data.scheduleItemsCreated;
          console.log(`[PaymentSync] Created ${unifiedPaymentsCreated} unified payment records`);
          
          if (syncResult.data.errors.length > 0) {
            console.warn(`[PaymentSync] Sync errors:`, syncResult.data.errors);
          }
        } else {
          console.error(`[PaymentSync] Failed to sync with unified_payments:`, syncResult.error);
        }
      }

      const result: FixResult = {
        agreementId,
        syncCompleted: true,
        scheduleExists: scheduleItems > 0,
        scheduleItems,
        unifiedPaymentsCreated
      };

      console.log(`[PaymentSync] Fix completed:`, result);
      return this.success(result);
    } catch (error) {
      console.error(`[PaymentSync] Failed to fix agreement payment sync:`, error);
      return this.error(error, 'Failed to fix agreement payment sync');
    }
  }

  /**
   * Get detailed payment sync status
   */
  async getPaymentSyncStatus(agreementId: string): Promise<Result<any>> {
    try {
      return await paymentScheduleSyncService.getPaymentComparisonDetails(agreementId);
    } catch (error) {
      return this.error(error, 'Failed to get payment sync status');
    }
  }
}

export const paymentSyncService = new PaymentSyncService(supabase);
