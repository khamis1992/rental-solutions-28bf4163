import { paymentRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { logOperation } from '@/utils/monitoring-utils';

// Define payment type for readability
export type PaymentRecord = TableRow<'unified_payments'>;

/**
 * Payment service responsible for all operations related to payments
 */
export class PaymentService extends BaseService<'unified_payments'> {
  constructor() {
    super(paymentRepository);
  }

  /**
   * Get payments for an agreement
   */
  async getPayments(agreementId: string): Promise<ServiceResult<Payment[]>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findByLeaseId(agreementId);
      
      if (response.error) {
        throw new Error(`Failed to fetch payments: ${response.error.message}`);
      }
      
      return response.data as Payment[];
    });
  }

  /**
   * Record a new payment
   */
  async recordPayment(paymentData: Partial<Payment>): Promise<ServiceResult<Payment>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.recordPayment(paymentData);
      
      if (response.error) {
        throw new Error(`Failed to record payment: ${response.error.message}`);
      }
      
      return response.data as Payment;
    });
  }

  /**
   * Update an existing payment
   */
  async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<ServiceResult<Payment>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.update(paymentId, paymentData);
      
      if (response.error) {
        throw new Error(`Failed to update payment: ${response.error.message}`);
      }
      
      return response.data as Payment;
    });
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<ServiceResult<boolean>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.delete(paymentId);
      
      if (response.error) {
        throw new Error(`Failed to delete payment: ${response.error.message}`);
      }
      
      return true;
    });
  }

  /**
   * Handle special agreement payments with late fee calculation
   */
  async handleSpecialPayment(
    agreementId: string,
    amount: number,
    paymentDate: Date,
    options: {
      notes?: string,
      paymentMethod?: string,
      referenceNumber?: string,
      includeLatePaymentFee?: boolean,
      isPartialPayment?: boolean,
      targetPaymentId?: string
    } = {}
  ): Promise<ServiceResult<boolean>> {
    return handleServiceOperation(async () => {
      // Set default options
      const {
        notes = '',
        paymentMethod = 'cash',
        referenceNumber,
        includeLatePaymentFee = false,
        isPartialPayment = false,
        targetPaymentId
      } = options;
      
      // Check if this is an additional payment for a partially paid record
      let existingPaymentId: string | null = null;
      let existingPaymentAmount = 0;
      let existingAmountPaid = 0;
      let existingBalance = 0;
      
      if (targetPaymentId) {
        const { data: existingPayment, error: queryError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('id', targetPaymentId)
          .single();
          
        if (queryError) {
          logOperation(
            'paymentService.handleSpecialPayment', 
            'error', 
            { targetPaymentId, error: queryError.message },
            'Error fetching existing payment'
          );
          throw new Error(`Failed to fetch payment: ${queryError.message}`);
        } else if (existingPayment) {
          existingPaymentId = existingPayment.id;
          existingPaymentAmount = existingPayment.amount || 0;
          existingAmountPaid = existingPayment.amount_paid || 0;
          existingBalance = existingPayment.balance || 0;
        }
      }
      
      // Get agreement data to access daily_late_fee
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('daily_late_fee, rent_amount, agreement_number')
        .eq('id', agreementId)
        .single();
      
      if (agreementError) {
        throw new Error(`Failed to fetch agreement data: ${agreementError.message}`);
      }
      
      // Use the daily_late_fee from the agreement
      const dailyLateFee = agreementData.daily_late_fee || 120;
      const rentAmount = agreementData.rent_amount || 0;
      
      // Calculate if there's a late fee applicable
      let lateFineAmount = 0;
      let daysLate = 0;
      
      // If payment is after the 1st of the month, calculate late fee
      if (paymentDate.getDate() > 1) {
        // Calculate days late (payment date - 1st of month)
        daysLate = paymentDate.getDate() - 1;
        
        // Calculate late fee amount (capped at 3000 QAR)
        lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      if (existingPaymentId) {
        // This is an additional payment for a partially paid record
        const totalPaid = existingAmountPaid + amount;
        const newBalance = existingPaymentAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
        
        // Update the existing payment record
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            amount_paid: totalPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod
          })
          .eq('id', existingPaymentId);
          
        if (updateError) {
          throw new Error(`Failed to record additional payment: ${updateError.message}`);
        }
      } else {
        // This is a new payment
        // Handle partial payment if selected
        let paymentStatus = 'completed';
        let amountPaid = amount;
        let balance = 0;
        
        if (isPartialPayment) {
          paymentStatus = 'partially_paid';
          balance = Math.max(0, rentAmount - amount);
        }
        
        // Form the payment record
        const paymentRecord = {
          lease_id: agreementId,
          amount: rentAmount,
          amount_paid: amountPaid,
          balance: balance,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || `Monthly rent payment for ${agreementData.agreement_number}`,
          status: paymentStatus,
          type: 'rent',
          days_overdue: daysLate,
          late_fine_amount: lateFineAmount,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        // Insert the payment record
        const { error } = await supabase
          .from('unified_payments')
          .insert(paymentRecord);
        
        if (error) {
          throw new Error(`Failed to record payment: ${error.message}`);
        }
        
        // If there's a late fee to apply and user opted to include it, record it as a separate transaction
        if (lateFineAmount > 0 && includeLatePaymentFee) {
          const lateFeeRecord = {
            lease_id: agreementId,
            amount: lateFineAmount,
            amount_paid: lateFineAmount,
            balance: 0,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            description: `Late payment fee for ${format(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
            status: 'completed',
            type: 'LATE_PAYMENT_FEE',
            late_fine_amount: lateFineAmount,
            days_overdue: daysLate,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          };
          
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert(lateFeeRecord);
          
          if (lateFeeError) {
            logOperation(
              'paymentService.handleSpecialPayment', 
              'error', 
              { agreementId, lateFineAmount, error: lateFeeError.message },
              'Late fee recording error'
            );
            throw new Error(`Payment recorded but failed to record late fee: ${lateFeeError.message}`);
          }
        }
      }
      
      return true;
    });
  }

  /**
   * Run maintenance checks on payment schedules
   */
  async checkAndCreateMissingPayments(): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        throw new Error(`Failed to check payment schedules: ${error.message}`);
      }
      
      return {
        success: true,
        data,
        message: "Payment schedule check completed successfully"
      };
    });
  }

  /**
   * Fix duplicate payment records for an agreement
   */
  async fixAgreementPayments(agreementId: string): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // First, get all payments for this agreement
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('original_due_date', { ascending: true });
      
      if (paymentsError) {
        throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
      }
      
      if (!payments || payments.length === 0) {
        return { 
          success: true, 
          message: "No payments found for this agreement",
          fixedCount: 0
        };
      }
      
      // Group payments by month to detect duplicates
      const paymentsByMonth: Record<string, any[]> = {};
      
      payments.forEach(payment => {
        if (!payment.original_due_date) return;
        
        const date = new Date(payment.original_due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!paymentsByMonth[monthKey]) {
          paymentsByMonth[monthKey] = [];
        }
        
        paymentsByMonth[monthKey].push(payment);
      });
      
      // Check for and fix duplicates
      let fixedCount = 0;
      
      for (const [month, monthlyPayments] of Object.entries(paymentsByMonth)) {
        // If there's more than one payment per month, we have duplicates
        if (monthlyPayments.length > 1) {
          // Sort payments by creation date, keeping the oldest
          monthlyPayments.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // Keep the first (oldest) payment and delete the rest
          const [keepPayment, ...duplicatePayments] = monthlyPayments;
          
          for (const duplicate of duplicatePayments) {
            const { error: deleteError } = await supabase
              .from('unified_payments')
              .delete()
              .eq('id', duplicate.id);
              
            if (deleteError) {
              logOperation(
                'paymentService.fixAgreementPayments', 
                'error', 
                { agreementId, paymentId: duplicate.id, error: deleteError.message },
                `Error deleting duplicate payment`
              );
            } else {
              logOperation(
                'paymentService.fixAgreementPayments', 
                'success', 
                { agreementId, paymentId: duplicate.id },
                `Successfully deleted duplicate payment`
              );
              fixedCount++;
            }
          }
        }
      }
      
      return { 
        success: true, 
        fixedCount,
        message: `Fixed ${fixedCount} duplicate payment records` 
      };
    });
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
