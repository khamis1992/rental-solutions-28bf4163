import { paymentRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { PaymentStatus } from '@/types/payment.types';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { asPaymentId, asLeaseId } from '@/lib/database/database-types';

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
  async getPayments(agreementId: string): Promise<ServiceResult<PaymentRecord[]>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findByLeaseId(agreementId);
      
      if (response.error) {
        throw new Error(`Failed to fetch payments: ${response.error.message}`);
      }
      
      return response.data as PaymentRecord[];
    });
  }

  /**
   * Record a new payment
   */
  async recordPayment(paymentData: Partial<PaymentRecord>): Promise<ServiceResult<PaymentRecord>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.recordPayment(paymentData);
      
      if (response.error) {
        throw new Error(`Failed to record payment: ${response.error.message}`);
      }
      
      return response.data as PaymentRecord;
    });
  }

  /**
   * Update an existing payment
   */
  async updatePayment(paymentId: string, paymentData: Partial<PaymentRecord>): Promise<ServiceResult<PaymentRecord>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.update(paymentId, paymentData);
      
      if (response.error) {
        throw new Error(`Failed to update payment: ${response.error.message}`);
      }
      
      return response.data as PaymentRecord;
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
      targetPaymentId?: string,
      paymentType?: string
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
        targetPaymentId,
        paymentType = 'rent'
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
          .eq('id', asPaymentId(targetPaymentId))
          .single();
          
        if (queryError) {
          console.error("Error fetching existing payment:", queryError);
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
        .eq('id', asLeaseId(agreementId))
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
            payment_method: paymentMethod,
            type: paymentType
          })
          .eq('id', asPaymentId(existingPaymentId));
          
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
          type: paymentType,
          days_overdue: daysLate,
          late_fine_amount: lateFineAmount,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        // Insert the payment record
        const { error } = await supabase
          .from('unified_payments')
          .insert([paymentRecord]);
        
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
            .insert([lateFeeRecord]);
          
          if (lateFeeError) {
            console.error("Late fee recording error:", lateFeeError);
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
  async checkAndCreateMissingPayments(agreementId?: string): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      let data;
      let error;
      
      // If agreementId is provided, only check for that agreement
      if (agreementId) {
        const response = await supabase.rpc('generate_missing_payment_records');
        data = response.data;
        error = response.error;
      } else {
        // Check for all agreements
        const response = await supabase.rpc('generate_missing_payment_records');
        data = response.data;
        error = response.error;
      }
      
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
   * Generate a payment schedule for a specific agreement
   * This replaces the forceGeneratePaymentForAgreement functionality
   */
  async generatePaymentForAgreement(agreementId: string): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // Check if agreement exists and is active
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('id, status, agreement_number, rent_amount, daily_late_fee')
        .eq('id', asLeaseId(agreementId))
        .single();
      
      if (agreementError) {
        throw new Error(`Failed to fetch agreement: ${agreementError.message}`);
      }
      
      if (!agreement) {
        throw new Error('Agreement not found');
      }
      
      if (agreement.status !== 'active') {
        throw new Error(`Cannot generate payment for non-active agreement (status: ${agreement.status})`);
      }
      
      // Get the current month and year
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Check if a payment already exists for this month
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreementId)
        .gte('original_due_date', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('original_due_date', new Date(currentYear, currentMonth + 1, 1).toISOString());
      
      if (paymentsError) {
        throw new Error(`Failed to check existing payments: ${paymentsError.message}`);
      }
      
      // If there's already a payment for this month, we don't need to create one
      if (existingPayments && existingPayments.length > 0) {
        return {
          success: true,
          message: "Payment already exists for the current month",
          data: { paymentExists: true }
        };
      }
      
      // Create a new payment record for the current month
      const paymentRecord = {
        lease_id: agreementId,
        amount: agreement.rent_amount,
        amount_paid: 0,
        balance: agreement.rent_amount,
        payment_date: null,
        status: 'pending',
        description: `Monthly rent payment for ${agreement.agreement_number} - ${format(new Date(currentYear, currentMonth), 'MMMM yyyy')}`,
        type: 'rent',
        days_overdue: 0,
        late_fine_amount: 0,
        original_due_date: new Date(currentYear, currentMonth, 1).toISOString()
      };
      
      // Insert the payment record
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentRecord])
        .select();
      
      if (error) {
        throw new Error(`Failed to create payment record: ${error.message}`);
      }
      
      return {
        success: true,
        message: "Payment schedule generated successfully",
        data: { payment: data[0] }
      };
    });
  }

  /**
   * Run system-wide payment maintenance job
   * This replaces the manuallyRunPaymentMaintenance functionality
   */
  async runPaymentMaintenanceJob(): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // Call the Supabase RPC function to generate missing payment records
      const { data, error } = await supabase.rpc('generate_missing_payment_records');
      
      if (error) {
        throw new Error(`Failed to run payment maintenance: ${error.message}`);
      }
      
      return {
        success: true,
        message: "Payment maintenance job completed successfully",
        data
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
        .eq('lease_id', asLeaseId(agreementId))
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
              console.error(`Error deleting duplicate payment ${duplicate.id}:`, deleteError);
            } else {
              console.log(`Successfully deleted duplicate payment ${duplicate.id}`);
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

  /**
   * Update status of historical payments to 'completed'
   * @param agreementId The ID of the agreement to update payments for
   * @param cutoffDate The date before which all payments should be marked as completed
   * @returns ServiceResult with count of updated records
   */
  async updateHistoricalPaymentStatuses(
    agreementId: string, 
    cutoffDate: Date
  ): Promise<ServiceResult<{updatedCount: number}>> {
    return handleServiceOperation(async () => {
      // Update all payments before the cutoff date to "completed" status
      const { data, error, count } = await supabase
        .from('unified_payments')
        .update({ status: 'completed' })
        .eq('lease_id', agreementId)
        .lt('payment_date', cutoffDate.toISOString())
        .not('status', 'eq', 'completed');

      if (error) {
        console.error("Error updating payment statuses:", error);
        throw new Error(`Failed to update payment statuses: ${error.message}`);
      }

      // Return the count of updated records
      return {
        updatedCount: count || 0
      };
    });
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
