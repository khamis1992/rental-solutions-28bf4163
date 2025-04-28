
import { supabase } from '@/integrations/supabase/client';
import { createTableQuery, executeQuery, asDbId } from '@/services/core/database-utils';
import { PaymentRow } from '@/services/core/database-types';
import { toast } from 'sonner';

// Re-export the query builder for convenience
export const paymentQuery = createTableQuery('unified_payments');

export interface PaymentData {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  payment_method: string | null;
  reference_number?: string;
  notes?: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  original_due_date: string | null;
  due_date: string | null;
  is_recurring: boolean;
  type: string;
  days_overdue: number;
  late_fine_amount: number;
  processing_fee?: number;
  processed_by?: string;
}

export interface PaymentFilterOptions {
  leaseId?: string;
  agreementNumber?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  paymentType?: string;
}

/**
 * Service for payment-related operations
 */
export class PaymentService {
  /**
   * Fetch payments with optional filtering
   */
  static async fetchPayments(options: PaymentFilterOptions = {}): Promise<PaymentData[]> {
    try {
      let query = supabase
        .from('unified_payments')
        .select('*');

      if (options.leaseId) {
        query = query.eq('lease_id', options.leaseId);
      }

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      if (options.paymentMethod && options.paymentMethod !== 'all') {
        query = query.eq('payment_method', options.paymentMethod);
      }

      if (options.paymentType && options.paymentType !== 'all') {
        query = query.eq('type', options.paymentType);
      }

      if (options.dateRange) {
        if (options.dateRange.from) {
          query = query.gte('payment_date', options.dateRange.from);
        }
        if (options.dateRange.to) {
          query = query.lte('payment_date', options.dateRange.to);
        }
      }

      // If agreement number is provided, we need to join with leases table
      if (options.agreementNumber) {
        query = supabase
          .from('unified_payments')
          .select('*, leases!inner(*)')
          .eq('leases.agreement_number', options.agreementNumber);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to fetch payments');
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      return data as PaymentData[];
    } catch (error: any) {
      console.error('Unexpected error in fetchPayments:', error);
      toast.error(`Error fetching payments: ${error.message || 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get payment details by ID
   */
  static async getPayment(id: string): Promise<PaymentData | null> {
    return executeQuery<PaymentData>(
      () => supabase
        .from('unified_payments')
        .select('*')
        .eq('id', id)
        .single(),
      `Failed to fetch payment with ID ${id}`
    );
  }

  /**
   * Record a new payment
   */
  static async recordPayment(data: Partial<PaymentRow>): Promise<PaymentData | null> {
    // Calculate balance if amount and amount_paid are provided
    if (data.amount !== undefined && data.amount_paid !== undefined) {
      data.balance = data.amount - data.amount_paid;
      
      // Set status based on balance
      data.status = data.balance <= 0 ? 'completed' : 'pending';
    }
    
    return executeQuery<PaymentData>(
      () => supabase
        .from('unified_payments')
        .insert(data)
        .select()
        .single(),
      'Failed to record payment'
    );
  }

  /**
   * Update an existing payment
   */
  static async updatePayment(id: string, data: Partial<PaymentRow>): Promise<PaymentData | null> {
    // Calculate balance if amount and amount_paid are provided
    if (data.amount !== undefined && data.amount_paid !== undefined) {
      data.balance = data.amount - data.amount_paid;
      
      // Set status based on balance
      data.status = data.balance <= 0 ? 'completed' : 'pending';
    }
    
    return executeQuery<PaymentData>(
      () => supabase
        .from('unified_payments')
        .update(data)
        .eq('id', id)
        .select()
        .single(),
      `Failed to update payment ${id}`
    );
  }

  /**
   * Delete a payment
   */
  static async deletePayment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        toast.error(`Failed to delete payment: ${error.message}`);
        return false;
      }

      toast.success('Payment deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error in deletePayment:', error);
      toast.error(`Failed to delete payment: ${error.message || 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Record a payment with late fee calculation
   */
  static async recordPaymentWithLateFee(
    leaseId: string, 
    amount: number,
    amountPaid: number,
    paymentMethod: string,
    paymentDate: Date,
    dueDate: Date,
    description?: string
  ): Promise<PaymentData | null> {
    try {
      // Calculate days overdue
      const daysOverdue = paymentDate > dueDate 
        ? Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Calculate late fee if payment is late
      const lateFee = daysOverdue > 0 ? daysOverdue * 120 : 0; // Assuming 120 QAR per day
      
      // Calculate balance
      const balance = amount - amountPaid;
      
      // Create the payment
      const paymentData: Partial<PaymentRow> = {
        lease_id: leaseId,
        amount,
        amount_paid: amountPaid,
        balance,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        status: balance <= 0 ? 'completed' : 'pending',
        description: description || 'Payment',
        type: 'Income',
        late_fine_amount: lateFee,
        days_overdue: daysOverdue,
        original_due_date: dueDate.toISOString()
      };
      
      // Record payment
      const payment = await this.recordPayment(paymentData);
      
      // If there's a late fee, record it as a separate payment
      if (lateFee > 0) {
        const lateFeePayment: Partial<PaymentRow> = {
          lease_id: leaseId,
          amount: lateFee,
          amount_paid: 0, // Late fee is not paid yet
          balance: lateFee,
          payment_date: null, // No payment date until it's paid
          original_due_date: paymentDate.toISOString(),
          status: 'pending',
          description: `Late fee for payment ${payment?.id}`,
          type: 'LATE_PAYMENT_FEE',
          late_fine_amount: 0, // No additional late fee on a late fee
          days_overdue: 0
        };
        
        await this.recordPayment(lateFeePayment);
      }
      
      return payment;
    } catch (error: any) {
      console.error('Error recording payment with late fee:', error);
      toast.error(`Failed to record payment: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get payment statistics for a lease
   */
  static async getPaymentStats(leaseId: string): Promise<{
    totalPaid: number;
    totalDue: number;
    totalLate: number;
    paymentCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('amount, amount_paid, late_fine_amount, type')
        .eq('lease_id', leaseId);

      if (error) {
        console.error('Error fetching payment statistics:', error);
        return {
          totalPaid: 0,
          totalDue: 0,
          totalLate: 0,
          paymentCount: 0
        };
      }

      let totalPaid = 0;
      let totalDue = 0;
      let totalLate = 0;

      data.forEach(payment => {
        if (payment.type === 'Income') {
          totalPaid += payment.amount_paid || 0;
          totalDue += payment.amount || 0;
        } else if (payment.type === 'LATE_PAYMENT_FEE') {
          totalLate += payment.amount || 0;
        }
      });

      return {
        totalPaid,
        totalDue,
        totalLate,
        paymentCount: data.filter(p => p.type === 'Income').length
      };
    } catch (error) {
      console.error('Error calculating payment statistics:', error);
      return {
        totalPaid: 0,
        totalDue: 0,
        totalLate: 0,
        paymentCount: 0
      };
    }
  }
}
