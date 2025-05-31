import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/error.types';
import { paymentScheduleService } from './PaymentScheduleService';
import { agreementSyncService } from './AgreementSyncService';
import { Agreement } from '@/types/agreement.types';
import { PaymentScheduleItem } from '@/services/PaymentScheduleService';

interface AgreementPaymentDefaults {
  payment_frequency?: 'monthly' | 'weekly' | 'biweekly';
  payment_day?: number;
  rent_due_day?: number;
}

interface SyncResult {
  agreementId: string;
  synced: boolean;
}

interface ScheduleSyncResult {
  updated: string[];
}

interface FixResult {
  agreementId: string;
  syncCompleted: boolean;
  scheduleExists: boolean;
  scheduleItems: number;
}

interface Payment {
  id: string;
  payment_date?: string;
  created_at: string;
}

/**
 * Enhanced Payment Synchronization Service
 * Fixes payment schedule generation and synchronization issues
 */
export class PaymentSyncService extends BaseService {
  
  /**
   * Comprehensive sync for a specific agreement with enhanced error handling
   */
  async syncAgreementPayments(agreementId: string): Promise<Result<SyncResult>> {
    try {
      console.log(`[PaymentSync] Starting comprehensive sync for agreement ${agreementId}`);
      
      // Step 1: Fetch and validate agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError || !agreement) {
        console.error(`[PaymentSync] Failed to fetch agreement ${agreementId}:`, agreementError);
        return this.error(agreementError, 'Failed to fetch agreement');
      }

      console.log(`[PaymentSync] Agreement found: ${agreement.agreement_number}, Status: ${agreement.status}`);

      // Step 2: Fix payment defaults if missing
      let needsUpdate = false;
      const updates: AgreementPaymentDefaults = {};

      if (!agreement.payment_frequency) {
        updates.payment_frequency = 'monthly';
        needsUpdate = true;
      }

      if (!agreement.payment_day && !agreement.rent_due_day) {
        updates.payment_day = 1;
        updates.rent_due_day = 1;
        needsUpdate = true;
      } else if (!agreement.payment_day && agreement.rent_due_day) {
        updates.payment_day = agreement.rent_due_day;
        needsUpdate = true;
      } else if (agreement.payment_day && !agreement.rent_due_day) {
        updates.rent_due_day = agreement.payment_day;
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`[PaymentSync] Updating payment defaults:`, updates);
        const { error: updateError } = await supabase
          .from('leases')
          .update(updates)
          .eq('id', agreementId);

        if (updateError) {
          console.warn(`[PaymentSync] Failed to update payment defaults:`, updateError);
        } else {
          console.log(`[PaymentSync] Payment defaults updated successfully`);
          // Update the agreement object with new values
          Object.assign(agreement, updates);
        }
      }

      // Step 3: Generate payment schedule if missing and agreement is active
      if (agreement.status === 'active' && agreement.start_date && agreement.end_date && agreement.rent_amount) {
        const scheduleResult = await paymentScheduleService.getPaymentSchedulesByLease(agreementId);
        
        if (scheduleResult.success && scheduleResult.data.length === 0) {
          console.log(`[PaymentSync] Generating missing payment schedule for agreement ${agreementId}`);
          
          // Create payment schedule items for each month
          const startDate = new Date(agreement.start_date);
          const endDate = new Date(agreement.end_date);
          const monthlyAmount = agreement.rent_amount;
          const paymentDay = agreement.payment_day || agreement.rent_due_day || 1;
          
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), paymentDay);
            if (dueDate >= startDate && dueDate <= endDate) {
              await paymentScheduleService.createPaymentSchedule({
                lease_id: agreementId,
                amount: monthlyAmount,
                due_date: dueDate.toISOString(),
                status: 'pending'
              });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          console.log(`[PaymentSync] Payment schedule generated`);
        } else if (scheduleResult.success) {
          console.log(`[PaymentSync] Payment schedule already exists with ${scheduleResult.data.length} items`);
        }
      } else {
        console.log(`[PaymentSync] Skipping schedule generation - Agreement not active or missing required fields`);
      }

      // Step 4: Sync with existing payments
      await this.syncScheduleWithPayments(agreementId);

      console.log(`[PaymentSync] Comprehensive sync completed for agreement ${agreementId}`);
      return this.success({ agreementId, synced: true });
    } catch (error) {
      console.error(`[PaymentSync] Failed to sync agreement payments:`, error);
      return this.error(error, 'Failed to sync agreement payments');
    }
  }

  /**
   * Sync payment schedules with actual payments
   */
  private async syncScheduleWithPayments(agreementId: string): Promise<Result<ScheduleSyncResult>> {
    try {
      console.log(`[PaymentSync] Syncing schedule with payments for agreement ${agreementId}`);
      
      // Get payment schedule
      const scheduleResult = await paymentScheduleService.getPaymentSchedulesByLease(agreementId);
      if (!scheduleResult.success) {
        return this.error(scheduleResult.error, 'Failed to get payment schedule');
      }

      // Get actual payments
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .eq('status', 'completed');

      if (paymentsError) {
        return this.error(paymentsError, 'Failed to get payments');
      }

      console.log(`[PaymentSync] Found ${scheduleResult.data.length} schedule items and ${payments?.length || 0} completed payments`);

      // Update schedule items that have corresponding payments
      const updates: string[] = [];
      
      for (const scheduleItem of scheduleResult.data) {
        const matchingPayment = payments?.find((payment: Payment) => {
          const paymentMonth = new Date(payment.payment_date || payment.created_at).getMonth();
          const scheduleMonth = new Date(scheduleItem.due_date).getMonth();
          const paymentYear = new Date(payment.payment_date || payment.created_at).getFullYear();
          const scheduleYear = new Date(scheduleItem.due_date).getFullYear();
          
          return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
        });

        if (matchingPayment && scheduleItem.status !== 'completed') {
          const updateResult = await paymentScheduleService.updateScheduleItemStatus(
            scheduleItem.id,
            'completed'
          );
          
          if (updateResult.success) {
            updates.push(scheduleItem.id);
            console.log(`[PaymentSync] Updated schedule item ${scheduleItem.id} to completed`);
          }
        }
      }

      console.log(`[PaymentSync] Updated ${updates.length} schedule items`);
      return this.success({ updated: updates });
    } catch (error) {
      console.error(`[PaymentSync] Failed to sync schedule with payments:`, error);
      return this.error(error, 'Failed to sync schedule with payments');
    }
  }

  /**
   * Fix specific agreement payment synchronization issue
   */
  async fixAgreementPaymentSync(agreementId: string): Promise<Result<FixResult>> {
    try {
      console.log(`[PaymentSync] Starting fix for agreement ${agreementId}`);
      
      // First run comprehensive sync
      const syncResult = await this.syncAgreementPayments(agreementId);
      
      if (!syncResult.success) {
        return syncResult;
      }

      // Validate the fix by checking if schedule exists and is populated
      const scheduleResult = await paymentScheduleService.getPaymentSchedulesByLease(agreementId);
      
      const result: FixResult = {
        agreementId,
        syncCompleted: syncResult.success,
        scheduleExists: scheduleResult.success && scheduleResult.data.length > 0,
        scheduleItems: scheduleResult.success ? scheduleResult.data.length : 0
      };

      console.log(`[PaymentSync] Fix completed:`, result);
      return this.success(result);
    } catch (error) {
      console.error(`[PaymentSync] Failed to fix agreement payment sync:`, error);
      return this.error(error, 'Failed to fix agreement payment sync');
    }
  }

  /**
   * Bulk fix for all agreements with payment sync issues
   */
  async fixAllAgreementPaymentSync(): Promise<Result<any>> {
    try {
      console.log(`[PaymentSync] Starting bulk fix for all agreements`);
      
      // Get all active agreements
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, agreement_number, status')
        .eq('status', 'active');

      if (agreementsError) {
        return this.error(agreementsError, 'Failed to fetch agreements');
      }

      const results = [];
      
      for (const agreement of agreements || []) {
        const fixResult = await this.fixAgreementPaymentSync(agreement.id);
        results.push({
          agreementId: agreement.id,
          agreementNumber: agreement.agreement_number,
          success: fixResult.success,
          data: fixResult.data
        });
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`[PaymentSync] Bulk fix completed: ${successCount}/${results.length} agreements fixed`);

      return this.success({
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      });
    } catch (error) {
      console.error(`[PaymentSync] Failed bulk fix:`, error);
      return this.error(error, 'Failed to fix all agreement payment sync');
    }
  }
}

export const paymentSyncService = new PaymentSyncService(supabase);
