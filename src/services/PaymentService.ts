import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';
import { Events, PaymentRecordedPayload } from '@/events';
import { castDbId } from '@/utils/supabase-type-helpers';
import { BaseService } from './base/BaseService';
import { Payment, SpecialPaymentOptions, PaymentStatus, PaymentType } from '@/types/payment.types';
import { PaymentInsert } from '@/types/payment-insert.types';
import { Result } from '@/lib/errors/types';
import { createPaymentError } from '@/lib/errors/types';
import { UnifiedPaymentStatus } from '@/types/status.types';

interface PaymentUpdateResult {
  updatedCount: number;
  updatedPayments?: Array<{
    id: string;
    oldStatus: UnifiedPaymentStatus;
    newStatus: UnifiedPaymentStatus;
  }>;
}

interface MissingPaymentDetail {
  agreementId: string;
  status: UnifiedPaymentStatus;
  message: string;
}

interface MissingPaymentsResult {
  fixedCount: number;
  details?: MissingPaymentDetail[];
}

interface MissingPaymentRecord {
  id: string | null;
  status: UnifiedPaymentStatus | null;
  status_description: string | null;
}

export class PaymentService extends BaseService {
  /**
   * Record a payment for an agreement
   */
  async recordPayment(paymentData: PaymentInsert): Promise<Result<Payment>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert(paymentData)
        .select()
        .single();
      
      if (error) {
        throw createPaymentError('Failed to record payment', {
          paymentId: paymentData.id,
          amount: paymentData.amount,
          reason: error.message
        });
      }

      if (!data) {
        throw createPaymentError('Payment record not found after insertion', {
          paymentId: paymentData.id,
          amount: paymentData.amount
        });
      }

      const payload: PaymentRecordedPayload = {
        paymentId: data.id,
        agreementId: data.lease_id,
        amount: data.amount_paid ?? data.amount
      };
      eventBus.publish(Events.PaymentRecorded, payload);

      return data;
    }, 'Failed to record payment');
  }

  /**
   * Get payments for an agreement
   */
  async getPayments(agreementId: string): Promise<Result<Payment[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('payment_date', { ascending: false });
      
      if (error) {
        throw createPaymentError('Failed to fetch payments', {
          reason: error.message
        });
      }
      
      return data || [];
    }, 'Failed to fetch payments');
  }

  /**
   * Update a payment
   */
  async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<Result<Payment>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .update(paymentData)
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) {
        throw createPaymentError('Failed to update payment', {
          paymentId,
          reason: error.message
        });
      }

      if (!data) {
        throw createPaymentError('Payment record not found after update', {
          paymentId
        });
      }
      
      return data;
    }, 'Failed to update payment');
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<Result<void>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) {
        throw createPaymentError('Failed to delete payment', {
          paymentId,
          reason: error.message
        });
      }
    }, 'Failed to delete payment');
  }

  /**
   * Handle special payment processing with late fee calculation
   */
  async handleSpecialPayment(
    agreementId: string, 
    amount: number, 
    paymentDate: Date, 
    options?: SpecialPaymentOptions
  ): Promise<Result<Payment>> {
    return this.safeExecute(async () => {
      // Default options
      const {
        notes,
        paymentMethod = 'cash',
        referenceNumber,
        includeLatePaymentFee = false,
        isPartialPayment = false,
        paymentType = 'regular' as PaymentType,
        targetPaymentId
      } = options || {};

      // Get agreement data for rent amount
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('rent_amount, daily_late_fee')
        .eq('id', agreementId)
        .single();

      if (leaseError) {
        throw createPaymentError('Failed to fetch lease data', {
          reason: leaseError.message
        });
      }

      if (!leaseData) {
        throw createPaymentError('Lease not found', {
          reason: 'Lease data not found'
        });
      }

      // Calculate late fee if applicable
      let lateFeeAmount = 0;
      if (includeLatePaymentFee && leaseData.daily_late_fee) {
        const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)));
        lateFeeAmount = daysOverdue * leaseData.daily_late_fee;
      }

      // Create payment record
      const paymentData: PaymentInsert = {
        lease_id: agreementId,
        amount: amount + lateFeeAmount,
        amount_paid: isPartialPayment ? amount : amount + lateFeeAmount,
        balance: isPartialPayment ? lateFeeAmount : 0,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        description: notes,
        status: isPartialPayment ? 'partially_paid' : 'paid',
        type: paymentType,
        days_overdue: includeLatePaymentFee ? Math.max(0, Math.floor((new Date().getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))) : null,
        late_fine_amount: lateFeeAmount,
        original_due_date: paymentDate.toISOString(),
        payment_reference: targetPaymentId
      };

      const result = await this.recordPayment(paymentData);
      if (!result.success) {
        throw createPaymentError('Failed to record payment', {
          reason: result.error?.toString() || 'Unknown error'
        });
      }

      return result.data;
    }, 'Failed to process special payment');
  }

  /**
   * Check and create missing payment schedules
   */
  async checkAndCreateMissingPayments(): Promise<Result<MissingPaymentsResult>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        throw createPaymentError('Failed to check payment schedules', {
          reason: error.message
        });
      }
      
      return {
        fixedCount: data?.length || 0,
        details: data?.map((item: MissingPaymentRecord) => ({
          agreementId: item.id || '',
          status: item.status || '',
          message: item.status_description || ''
        }))
      };
    }, 'Failed to check payment schedules');
  }

  /**
   * Fix payments for a specific agreement
   */
  async fixAgreementPayments(agreementId: string): Promise<Result<MissingPaymentsResult>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        throw createPaymentError('Failed to fix agreement payments', {
          reason: error.message
        });
      }
      
      return {
        fixedCount: data?.length || 0,
        details: data?.map((item: MissingPaymentRecord) => ({
          agreementId: item.id || '',
          status: item.status || '',
          message: item.status_description || ''
        }))
      };
    }, 'Failed to fix agreement payments');
  }

  /**
   * Update historical payment statuses
   */
  async updateHistoricalPaymentStatuses(
    agreementId: string, 
    cutoffDate: Date
  ): Promise<Result<PaymentUpdateResult>> {
    return this.safeExecute(async () => {
      // Get all payments before cutoff date
      const { data: payments, error: fetchError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .lt('payment_date', cutoffDate.toISOString())
        .neq('status', 'completed');

      if (fetchError) {
        throw createPaymentError('Failed to fetch payments', {
          reason: fetchError.message
        });
      }

      if (!payments || payments.length === 0) {
        return { updatedCount: 0 };
      }

      // Update each payment to completed status
      let updatedCount = 0;
      let updatedPayments: Array<{ id: string; oldStatus: UnifiedPaymentStatus; newStatus: UnifiedPaymentStatus }> = [];
      for (const payment of payments) {
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({ status: 'completed' })
          .eq('id', payment.id);

        if (!updateError) {
          updatedCount++;
          updatedPayments.push({
            id: payment.id,
            oldStatus: payment.status,
            newStatus: 'completed'
          });
        }
      }

      return { updatedCount, updatedPayments };
    }, 'Failed to update historical payment statuses');
  }
}

// Create a singleton instance
export const paymentService = new PaymentService(supabase);
