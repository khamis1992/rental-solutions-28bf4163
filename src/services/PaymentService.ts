
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError 
} from '@/types/error.types';
import { Payment, PaymentRecord } from '@/types/payment.types';
import { PaymentInsert } from '@/types/payment-insert.types';

export class PaymentService extends BaseService {
  constructor() {
    super(supabase);
  }

  async getPayments(leaseId: string): Promise<Result<Payment[]>> {
    return this.safeExecute(async () => {
      console.log('PaymentService.getPayments called with leaseId:', leaseId);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw this.createServiceError(
          'Failed to fetch payments',
          'getPayments'
        );
      }

      console.log('PaymentService.getPayments result:', data?.length || 0, 'payments found');
      return data as Payment[];
    }, 'Failed to fetch payments');
  }

  async recordPayment(paymentData: PaymentInsert): Promise<Result<PaymentRecord>> {
    return this.safeExecute(async () => {
      console.log('PaymentService.recordPayment called with:', paymentData);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        console.error('Error recording payment:', error);
        throw this.createServiceError(
          'Failed to record payment',
          'recordPayment'
        );
      }

      console.log('PaymentService.recordPayment success:', data);
      return data as PaymentRecord;
    }, 'Failed to record payment');
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Result<Payment>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update payment',
          'updatePayment'
        );
      }

      if (!data) {
        throw createNotFoundError('Payment', id);
      }

      return data as Payment;
    }, 'Failed to update payment');
  }

  async deletePayment(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);

      if (error) {
        throw this.createServiceError(
          'Failed to delete payment',
          'deletePayment'
        );
      }

      return true;
    }, 'Failed to delete payment');
  }

  async fixAgreementPayments(agreementId: string): Promise<Result<{ fixedCount: number }>> {
    return this.safeExecute(async () => {
      console.log('PaymentService.fixAgreementPayments called for:', agreementId);
      
      // Call the stored procedure to fix payment records
      const { data, error } = await supabase.rpc('fix_agreement_payments', {
        p_lease_id: agreementId
      });

      if (error) {
        console.error('Error fixing agreement payments:', error);
        throw this.createServiceError(
          'Failed to fix agreement payments',
          'fixAgreementPayments'
        );
      }

      console.log('PaymentService.fixAgreementPayments result:', data);
      return { fixedCount: data?.fixed_count || 0 };
    }, 'Failed to fix agreement payments');
  }

  async handleSpecialPayment(
    agreementId: string,
    amount: number,
    paymentDate: Date,
    options?: {
      notes?: string;
      paymentMethod?: string;
      referenceNumber?: string;
      includeLatePaymentFee?: boolean;
      isPartialPayment?: boolean;
      paymentType?: string;
      targetPaymentId?: string;
    }
  ): Promise<Result<PaymentRecord>> {
    return this.safeExecute(async () => {
      const paymentData: PaymentInsert = {
        lease_id: agreementId,
        amount,
        payment_date: paymentDate.toISOString(),
        original_due_date: paymentDate.toISOString(),
        description: options?.notes || 'Special Payment',
        status: 'completed',
        type: options?.paymentType || 'rent',
        payment_method: options?.paymentMethod || 'cash',
        reference_number: options?.referenceNumber
      };

      return this.recordPayment(paymentData);
    }, 'Failed to handle special payment');
  }

  async checkAndCreateMissingPayments(): Promise<Result<{ createdCount: number }>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');

      if (error) {
        throw this.createServiceError(
          'Failed to check and create missing payments',
          'checkAndCreateMissingPayments'
        );
      }

      return { createdCount: data?.created_count || 0 };
    }, 'Failed to check and create missing payments');
  }

  async updateHistoricalPaymentStatuses(agreementId: string, cutoffDate: Date): Promise<Result<{ updatedCount: number }>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreementId)
        .eq('status', 'pending')
        .lt('original_due_date', cutoffDate.toISOString());
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { updatedCount: 0 };
      }
      
      const paymentIds = data.map(payment => payment.id);
      const { error: updateError } = await supabase
        .from('unified_payments')
        .update({ status: 'completed' })
        .in('id', paymentIds);
      
      if (updateError) throw updateError;
      
      return { updatedCount: paymentIds.length };
    }, 'Failed to update historical payment statuses');
  }
}

export const paymentService = new PaymentService();
