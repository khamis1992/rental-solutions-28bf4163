import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { paymentScheduleService } from './PaymentScheduleService';
import { paymentScheduleSyncService } from './PaymentScheduleSyncService';

interface FixResult {
  agreementId: string;
  syncCompleted: boolean;
  scheduleExists: boolean;
  scheduleItems: number;
  unifiedPaymentsCreated: number;
  generatedScheduleItems?: number;
}

interface SyncStatusResult {
  scheduleTables: {
    payment_schedules: number;
    unified_payments: number;
  };
  details?: any;
}

/**
 * Enhanced Payment Synchronization Service
 * Focuses on fixing payment schedule generation and synchronization with unified_payments
 */
export class PaymentSyncService extends BaseService {
  
  /**
   * Fix specific agreement payment synchronization issue
   */
  async fixAgreementPaymentSync(agreementId: string): Promise<{ success: boolean; data?: FixResult; error?: Error }> {
    try {
      console.log(`[PaymentSync] Starting payment sync fix for agreement ${agreementId}`);
      
      // Step 1: Get agreement details
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError || !agreement) {
        const errorMsg = `Agreement not found: ${agreementError?.message || 'No agreement data'}`;
        console.error(`[PaymentSync] ${errorMsg}`);
        return { success: false, error: new Error(errorMsg) };
      }

      console.log(`[PaymentSync] Found agreement: ${agreement.agreement_number}, Status: ${agreement.status}`);

      // Step 2: Check existing payment schedule
      const { data: existingSchedule, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', agreementId);

      if (scheduleError) {
        console.error(`[PaymentSync] Error fetching schedule:`, scheduleError);
        return { success: false, error: scheduleError };
      }

      let scheduleItems = existingSchedule?.length || 0;
      let generatedScheduleItems = 0;
      
      console.log(`[PaymentSync] Found ${scheduleItems} existing schedule items`);

      // Step 3: Generate payment schedule if missing and agreement is active
      if (scheduleItems === 0 && agreement.status === 'active') {
        console.log(`[PaymentSync] Generating payment schedule for agreement ${agreementId}`);
        
        // Validate required data
        const rentAmount = agreement.rent_amount || 0;
        const startDate = agreement.start_date ? new Date(agreement.start_date) : null;
        const endDate = agreement.end_date ? new Date(agreement.end_date) : null;
        const paymentFrequency = agreement.payment_frequency || 'monthly';
        const paymentDay = agreement.payment_day || agreement.rent_due_day || 1;

        if (rentAmount > 0 && startDate && endDate) {
          try {
            const generateResult = await paymentScheduleService.generateAndPersistSchedule(
              agreementId,
              startDate,
              endDate,
              rentAmount,
              paymentFrequency,
              paymentDay
            );

            if (generateResult.success && generateResult.data) {
              generatedScheduleItems = generateResult.data.length;
              scheduleItems = generatedScheduleItems;
              console.log(`[PaymentSync] Successfully generated ${generatedScheduleItems} schedule items`);
            } else {
              const errorMsg = generateResult.error instanceof Error 
                ? generateResult.error.message 
                : typeof generateResult.error === 'string' 
                  ? generateResult.error 
                  : 'Unknown error during schedule generation';
              console.error(`[PaymentSync] Failed to generate schedule: ${errorMsg}`);
              // Don't fail completely, continue with sync
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[PaymentSync] Exception during schedule generation: ${errorMsg}`);
            // Don't fail completely, continue with sync
          }
        } else {
          const missingFields = [];
          if (rentAmount <= 0) missingFields.push('rent_amount');
          if (!startDate) missingFields.push('start_date');
          if (!endDate) missingFields.push('end_date');
          
          console.warn(`[PaymentSync] Missing required data for schedule generation: ${missingFields.join(', ')}`);
        }
      }

      // Step 4: Sync payment schedule with unified_payments table
      let unifiedPaymentsCreated = 0;
      if (scheduleItems > 0) {
        console.log(`[PaymentSync] Syncing ${scheduleItems} schedule items with unified_payments`);
        
        try {
          const syncResult = await paymentScheduleSyncService.checkPaymentScheduleSync(agreementId);
          if (syncResult.success && syncResult.data) {
            unifiedPaymentsCreated = syncResult.data.scheduleItemsCreated;
            console.log(`[PaymentSync] Created ${unifiedPaymentsCreated} unified payment records`);
            
            if (syncResult.data.errors.length > 0) {
              console.warn(`[PaymentSync] Sync errors:`, syncResult.data.errors);
            }
          } else {
            const errorMsg = syncResult.error instanceof Error 
              ? syncResult.error.message 
              : typeof syncResult.error === 'string' 
                ? syncResult.error 
                : 'Unknown sync error';
            console.error(`[PaymentSync] Failed to sync with unified_payments: ${errorMsg}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[PaymentSync] Exception during unified payment sync: ${errorMsg}`);
        }
      }

      const result: FixResult = {
        agreementId,
        syncCompleted: true,
        scheduleExists: scheduleItems > 0,
        scheduleItems,
        unifiedPaymentsCreated,
        generatedScheduleItems
      };

      console.log(`[PaymentSync] Fix completed successfully:`, result);
      return { success: true, data: result };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PaymentSync] Failed to fix agreement payment sync:`, error);
      return { success: false, error: new Error(errorMsg) };
    }
  }

  /**
   * Get detailed payment sync status
   */
  async getPaymentSyncStatus(agreementId: string): Promise<{ success: boolean; data?: SyncStatusResult; error?: Error }> {
    try {
      const [scheduleResult, paymentsResult] = await Promise.all([
        supabase.from('payment_schedules').select('id').eq('lease_id', agreementId),
        supabase.from('unified_payments').select('id').eq('lease_id', agreementId)
      ]);

      if (scheduleResult.error) {
        return { success: false, error: scheduleResult.error };
      }

      if (paymentsResult.error) {
        return { success: false, error: paymentsResult.error };
      }

      const result: SyncStatusResult = {
        scheduleTables: {
          payment_schedules: scheduleResult.data?.length || 0,
          unified_payments: paymentsResult.data?.length || 0
        }
      };

      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: new Error(errorMsg) };
    }
  }
}

export const paymentSyncService = new PaymentSyncService(supabase);
