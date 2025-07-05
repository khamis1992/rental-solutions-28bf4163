import { supabase } from '@/lib/supabase';
import { carInstallmentService } from './CarInstallmentService';
import { notificationService } from './NotificationService';
import { cacheService } from './CacheService';
import { CarInstallmentPayment, CarInstallmentContract } from '@/types/car-installment';
import { Result } from '@/types/response.types';
import { createServiceError } from '@/types/error.types';

export interface PaymentProcessingResult {
  success: boolean;
  paymentId?: string;
  contractId?: string;
  newStatus?: string;
  message?: string;
  error?: string;
}

export interface BulkPaymentResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: PaymentProcessingResult[];
}

export class PaymentProcessingService {
  
  // Process a single payment
  async processPayment(
    paymentId: string, 
    paidAmount: number, 
    paymentDate?: Date,
    notes?: string
  ): Promise<PaymentProcessingResult> {
    try {
      // Get the payment details
      const { data: payment, error: paymentError } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      // Calculate new status based on paid amount
      let newStatus = payment.status;
      const totalAmount = payment.amount;
      const currentPaidAmount = payment.paid_amount || 0;
      const totalPaid = currentPaidAmount + paidAmount;

      if (totalPaid >= totalAmount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      // Update the payment
      const updateData = {
        paid_amount: totalPaid,
        status: newStatus,
        payment_date: paymentDate ? paymentDate.toISOString() : payment.payment_date,
        notes: notes || payment.notes,
        updated_at: new Date().toISOString()
      };

      const { data: updatedPayment, error: updateError } = await supabase
        .from('car_installment_payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: 'Failed to update payment'
        };
      }

      // Recalculate contract summary
      if (payment.contract_id) {
        await carInstallmentService.recalculateContractSummary(payment.contract_id);
        
        // Invalidate cache
        cacheService.invalidateContractCache(payment.contract_id);
      }

      // Send notification if payment is completed
      if (newStatus === 'paid' && payment.status !== 'paid') {
        const { data: contract } = await supabase
          .from('car_installment_contracts')
          .select('*')
          .eq('id', payment.contract_id)
          .single();

        if (contract) {
          await notificationService.sendPaymentReceivedNotification(updatedPayment, contract);
        }
      }

      return {
        success: true,
        paymentId: updatedPayment.id,
        contractId: payment.contract_id,
        newStatus,
        message: `Payment processed successfully. Status: ${newStatus}`
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: 'Internal error processing payment'
      };
    }
  }

  // Process multiple payments in bulk
  async processBulkPayments(
    payments: Array<{
      paymentId: string;
      paidAmount: number;
      paymentDate?: Date;
      notes?: string;
    }>
  ): Promise<BulkPaymentResult> {
    const results: PaymentProcessingResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const paymentData of payments) {
      const result = await this.processPayment(
        paymentData.paymentId,
        paymentData.paidAmount,
        paymentData.paymentDate,
        paymentData.notes
      );

      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      totalProcessed: payments.length,
      successful,
      failed,
      results
    };
  }

  // Auto-process payments based on external payment gateway data
  async autoProcessPayments(
    externalPayments: Array<{
      referenceId: string; // This would match payment.id or external reference
      amount: number;
      transactionDate: Date;
      transactionId: string;
      status: 'success' | 'failed' | 'pending';
    }>
  ): Promise<BulkPaymentResult> {
    const results: PaymentProcessingResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const externalPayment of externalPayments) {
      try {
        if (externalPayment.status !== 'success') {
          results.push({
            success: false,
            error: `External payment failed or pending: ${externalPayment.status}`
          });
          failed++;
          continue;
        }

        // Find the corresponding payment
        const { data: payment, error } = await supabase
          .from('car_installment_payments')
          .select('*')
          .eq('id', externalPayment.referenceId)
          .single();

        if (error || !payment) {
          results.push({
            success: false,
            error: 'Payment not found for reference ID'
          });
          failed++;
          continue;
        }

        // Process the payment
        const result = await this.processPayment(
          payment.id,
          externalPayment.amount,
          externalPayment.transactionDate,
          `Auto-processed from transaction: ${externalPayment.transactionId}`
        );

        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

      } catch (error) {
        console.error('Error auto-processing payment:', error);
        results.push({
          success: false,
          error: 'Internal error during auto-processing'
        });
        failed++;
      }
    }

    return {
      totalProcessed: externalPayments.length,
      successful,
      failed,
      results
    };
  }

  // Reverse a payment (in case of refund or error)
  async reversePayment(
    paymentId: string,
    reverseAmount: number,
    reason: string
  ): Promise<PaymentProcessingResult> {
    try {
      // Get the payment details
      const { data: payment, error: paymentError } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      const currentPaidAmount = payment.paid_amount || 0;
      const newPaidAmount = Math.max(0, currentPaidAmount - reverseAmount);
      
      // Determine new status
      let newStatus = 'pending';
      if (newPaidAmount >= payment.amount) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      } else {
        // Check if overdue
        const paymentDate = new Date(payment.payment_date);
        const today = new Date();
        if (paymentDate < today) {
          newStatus = 'overdue';
        }
      }

      // Update the payment
      const { data: updatedPayment, error: updateError } = await supabase
        .from('car_installment_payments')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          notes: `${payment.notes || ''}\nReversed ${reverseAmount} - Reason: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: 'Failed to reverse payment'
        };
      }

      // Recalculate contract summary
      if (payment.contract_id) {
        await carInstallmentService.recalculateContractSummary(payment.contract_id);
        cacheService.invalidateContractCache(payment.contract_id);
      }

      return {
        success: true,
        paymentId: updatedPayment.id,
        contractId: payment.contract_id,
        newStatus,
        message: `Payment reversed successfully. Amount: ${reverseAmount}`
      };

    } catch (error) {
      console.error('Error reversing payment:', error);
      return {
        success: false,
        error: 'Internal error reversing payment'
      };
    }
  }

  // Generate payment schedule for a contract
  async generatePaymentSchedule(
    contractId: string,
    startDate: Date,
    numberOfInstallments: number,
    installmentAmount: number,
    frequency: 'monthly' | 'weekly' | 'quarterly' = 'monthly'
  ): Promise<Result<CarInstallmentPayment[]>> {
    try {
      const payments: Partial<CarInstallmentPayment>[] = [];
      
      for (let i = 0; i < numberOfInstallments; i++) {
        const paymentDate = new Date(startDate);
        
        switch (frequency) {
          case 'weekly':
            paymentDate.setDate(paymentDate.getDate() + (i * 7));
            break;
          case 'monthly':
            paymentDate.setMonth(paymentDate.getMonth() + i);
            break;
          case 'quarterly':
            paymentDate.setMonth(paymentDate.getMonth() + (i * 3));
            break;
        }

        payments.push({
          contract_id: contractId,
          installment_number: i + 1,
          amount: installmentAmount,
          paid_amount: 0,
          payment_date: paymentDate.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Insert all payments
      const { data: createdPayments, error } = await supabase
        .from('car_installment_payments')
        .insert(payments)
        .select();

      if (error) {
        throw createServiceError('Failed to generate payment schedule', { error: error.message });
      }

      // Invalidate cache
      cacheService.invalidateContractCache(contractId);

      return {
        success: true,
        data: createdPayments as CarInstallmentPayment[],
        error: null
      };

    } catch (error) {
      console.error('Error generating payment schedule:', error);
      return {
        success: false,
        data: null,
        error: error as any
      };
    }
  }

  // Get payment statistics for a contract
  async getPaymentStatistics(contractId: string): Promise<{
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    overduePayments: number;
    partialPayments: number;
    totalPaid: number;
    totalPending: number;
    completionPercentage: number;
  }> {
    try {
      const { data: payments, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId);

      if (error || !payments) {
        return {
          totalPayments: 0,
          paidPayments: 0,
          pendingPayments: 0,
          overduePayments: 0,
          partialPayments: 0,
          totalPaid: 0,
          totalPending: 0,
          completionPercentage: 0
        };
      }

      const stats = {
        totalPayments: payments.length,
        paidPayments: payments.filter(p => p.status === 'paid').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        overduePayments: payments.filter(p => p.status === 'overdue').length,
        partialPayments: payments.filter(p => p.status === 'partial').length,
        totalPaid: payments.reduce((sum, p) => sum + (p.paid_amount || 0), 0),
        totalPending: payments.reduce((sum, p) => sum + (p.amount - (p.paid_amount || 0)), 0),
        completionPercentage: 0
      };

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      stats.completionPercentage = totalAmount > 0 ? (stats.totalPaid / totalAmount) * 100 : 0;

      return stats;

    } catch (error) {
      console.error('Error getting payment statistics:', error);
      return {
        totalPayments: 0,
        paidPayments: 0,
        pendingPayments: 0,
        overduePayments: 0,
        partialPayments: 0,
        totalPaid: 0,
        totalPending: 0,
        completionPercentage: 0
      };
    }
  }
}

export const paymentProcessingService = new PaymentProcessingService(); 