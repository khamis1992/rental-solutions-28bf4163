
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/error.types';

interface PaymentScheduleItem {
  id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: string;
  description?: string;
}

interface SyncResult {
  scheduleItemsFound: number;
  unifiedPaymentsFound: number;
  scheduleItemsCreated: number;
  errors: string[];
}

export class PaymentScheduleSyncService extends BaseService {
  constructor() {
    super(supabase);
  }

  /**
   * Check if payment schedule items exist in unified_payments table
   */
  async checkPaymentScheduleSync(leaseId: string): Promise<Result<SyncResult>> {
    return this.safeExecute(async () => {
      console.log(`Checking payment schedule sync for lease: ${leaseId}`);
      
      // Get payment schedule items
      const { data: scheduleItems, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: true });

      if (scheduleError) {
        throw new Error(`Failed to fetch payment schedule: ${scheduleError.message}`);
      }

      // Get unified payments
      const { data: unifiedPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: true });

      if (paymentsError) {
        throw new Error(`Failed to fetch unified payments: ${paymentsError.message}`);
      }

      console.log(`Found ${scheduleItems?.length || 0} schedule items and ${unifiedPayments?.length || 0} unified payments`);

      const result: SyncResult = {
        scheduleItemsFound: scheduleItems?.length || 0,
        unifiedPaymentsFound: unifiedPayments?.length || 0,
        scheduleItemsCreated: 0,
        errors: []
      };

      // Check if we need to create unified payment records for schedule items
      const scheduleItemsToCreate = scheduleItems?.filter(scheduleItem => {
        // Check if there's already a unified payment for this schedule item
        return !unifiedPayments?.some(payment => {
          const paymentMonth = new Date(payment.payment_date || payment.original_due_date || '').getMonth();
          const paymentYear = new Date(payment.payment_date || payment.original_due_date || '').getFullYear();
          const scheduleMonth = new Date(scheduleItem.due_date).getMonth();
          const scheduleYear = new Date(scheduleItem.due_date).getFullYear();
          
          return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
        });
      }) || [];

      // Create unified payment records for missing schedule items
      for (const scheduleItem of scheduleItemsToCreate) {
        try {
          const { error: insertError } = await supabase
            .from('unified_payments')
            .insert({
              lease_id: scheduleItem.lease_id,
              amount: scheduleItem.amount,
              amount_paid: 0,
              balance: scheduleItem.amount,
              payment_date: null,
              original_due_date: scheduleItem.due_date,
              status: 'pending',
              description: scheduleItem.description || `Payment for ${new Date(scheduleItem.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
              type: 'Income',
              schedule_id: scheduleItem.id
            });

          if (insertError) {
            result.errors.push(`Failed to create unified payment for schedule ${scheduleItem.id}: ${insertError.message}`);
          } else {
            result.scheduleItemsCreated++;
            console.log(`Created unified payment for schedule item ${scheduleItem.id}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Error creating unified payment for schedule ${scheduleItem.id}: ${errorMessage}`);
        }
      }

      console.log(`Sync result:`, result);
      return result;
    }, 'Failed to check payment schedule sync');
  }

  /**
   * Get detailed comparison between payment schedules and unified payments
   */
  async getPaymentComparisonDetails(leaseId: string): Promise<Result<any>> {
    return this.safeExecute(async () => {
      // Get payment schedule items
      const { data: scheduleItems } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: true });

      // Get unified payments
      const { data: unifiedPayments } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: true });

      return {
        scheduleItems: scheduleItems || [],
        unifiedPayments: unifiedPayments || [],
        scheduleTables: {
          payment_schedules: scheduleItems?.length || 0,
          unified_payments: unifiedPayments?.length || 0
        }
      };
    }, 'Failed to get payment comparison details');
  }
}

export const paymentScheduleSyncService = new PaymentScheduleSyncService();
