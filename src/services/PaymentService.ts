
import { supabase } from '@/lib/supabase';
import { castDbId } from '@/utils/supabase-type-helpers';
import { BaseService } from './base/BaseService';
import { Payment, PaymentInsert, SpecialPaymentOptions } from '@/types/payment.types';
import { ServiceResponse } from '@/types/service.types';

export class PaymentService extends BaseService {
  /**
   * Record a payment for an agreement
   */
  async recordPayment(paymentData: PaymentInsert): Promise<ServiceResponse<Payment>> {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert(paymentData)
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, 'Failed to record payment');
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred recording payment');
    }
  }

  /**
   * Get payments for an agreement
   */
  async getPayments(agreementId: string): Promise<ServiceResponse<Payment[]>> {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('payment_date', { ascending: false });
      
      if (error) {
        return this.handleError(error, 'Failed to fetch payments');
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred fetching payments');
    }
  }

  /**
   * Update a payment
   */
  async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<ServiceResponse<Payment>> {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .update(paymentData)
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, 'Failed to update payment');
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred updating payment');
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) {
        return this.handleError(error, 'Failed to delete payment');
      }
      
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred deleting payment');
    }
  }

  /**
   * Handle special payment processing with late fee calculation
   */
  async handleSpecialPayment(
    agreementId: string, 
    amount: number, 
    paymentDate: Date, 
    options?: SpecialPaymentOptions
  ): Promise<ServiceResponse<Payment>> {
    try {
      // Default options
      const {
        notes,
        paymentMethod = 'cash',
        referenceNumber,
        includeLatePaymentFee = false,
        isPartialPayment = false,
        paymentType = 'rent',
        targetPaymentId
      } = options || {};

      // Get agreement data for rent amount
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('daily_late_fee, rent_amount')
        .eq('id', agreementId)
        .single();
        
      if (leaseError) {
        return this.handleError(leaseError, 'Error fetching lease data');
      }
      
      const rentAmount = leaseData?.rent_amount || 0;
      
      // Calculate days late and late fee
      let daysLate = 0;
      let lateFineAmount = 0;
      
      if (paymentDate.getDate() > 1) {
        daysLate = paymentDate.getDate() - 1;
        lateFineAmount = Math.min(daysLate * (leaseData?.daily_late_fee || 120), 3000);
      }
      
      // Create payment record
      const paymentData = {
        lease_id: agreementId,
        amount: rentAmount || amount,
        amount_paid: amount,
        balance: isPartialPayment ? Math.max(0, rentAmount - amount) : 0,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        description: notes || `Monthly rent payment`,
        status: isPartialPayment ? 'partially_paid' : 'completed',
        type: paymentType,
        days_overdue: daysLate,
        late_fine_amount: lateFineAmount,
        original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
      };
      
      // Record the payment
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, 'Failed to record payment');
      }
      
      // Record late fee if applicable
      if (lateFineAmount > 0 && includeLatePaymentFee) {
        const lateFeePayment = {
          lease_id: agreementId,
          amount: lateFineAmount,
          amount_paid: lateFineAmount,
          balance: 0,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: `Late payment fee (${daysLate} days late)`,
          status: 'completed',
          type: 'LATE_PAYMENT_FEE',
          days_overdue: daysLate,
          late_fine_amount: lateFineAmount,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        await supabase
          .from('unified_payments')
          .insert([lateFeePayment]);
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred processing special payment');
    }
  }

  /**
   * Check and create missing payment schedules
   */
  async checkAndCreateMissingPayments(): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        return this.handleError(error, 'Failed to check payment schedules');
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred checking payment schedules');
    }
  }

  /**
   * Fix payments for a specific agreement
   */
  async fixAgreementPayments(agreementId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.supabase.fixAgreementPayments(castDbId(agreementId));
      return this.success(result);
    } catch (error) {
      return this.handleError(error, 'Failed to fix agreement payments');
    }
  }

  /**
   * Update historical payment statuses
   */
  async updateHistoricalPaymentStatuses(
    agreementId: string, 
    cutoffDate: Date
  ): Promise<ServiceResponse<{updatedCount: number}>> {
    try {
      // Get all pending payments before cutoff date
      const { data, error } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreementId)
        .eq('status', 'pending')
        .lt('original_due_date', cutoffDate.toISOString());
      
      if (error) {
        return this.handleError(error, 'Failed to fetch historical payments');
      }
      
      if (!data || data.length === 0) {
        return this.success({ updatedCount: 0 });
      }
      
      // Update all found payments to completed
      const paymentIds = data.map(payment => payment.id);
      const { error: updateError } = await supabase
        .from('unified_payments')
        .update({ status: 'completed' })
        .in('id', paymentIds);
      
      if (updateError) {
        return this.handleError(updateError, 'Failed to update payment statuses');
      }
      
      return this.success({ updatedCount: paymentIds.length });
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred updating payment statuses');
    }
  }
}

// Create a singleton instance
export const paymentService = new PaymentService(supabase);
