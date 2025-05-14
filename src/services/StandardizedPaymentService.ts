/**
 * Standardized PaymentService for the Fleet Management System
 */
import { supabase } from '@/lib/supabase';
import { BaseService } from './BaseService';
import { Payment, PaymentInsert, PaymentStatus, SpecialPaymentOptions } from '@/types/payment.types';
import { handleError } from '@/utils/error-handler';
import { validateData } from '@/utils/validation';
import { 
  paymentSchema, 
  paymentInsertSchema, 
  paymentUpdateSchema,
  specialPaymentOptionsSchema 
} from '@/schemas/payment.schema';

export interface PaginatedPaymentResult {
  data: Payment[];
  count: number;
}

/**
 * Service for managing payment operations
 */
export class PaymentService extends BaseService {
  constructor() {
    super('unified_payments');
  }

  /**
   * Get payments with filtering and pagination
   */
  async getPayments(
    filters: {
      agreementId?: string;
      status?: PaymentStatus | PaymentStatus[];
      fromDate?: Date;
      toDate?: Date;
      type?: string;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ): Promise<PaginatedPaymentResult | null> {
    try {
      // Start building the query
      let query = supabase.from('unified_payments').select(`
        *,
        lease:lease_id(agreement_number, customer_id, vehicle_id),
        lease.customers:customer_id(full_name),
        lease.vehicles(license_plate, make, model)
      `, { count: 'exact' });

      // Apply filters
      if (filters.agreementId) {
        query = query.eq('lease_id', filters.agreementId);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.fromDate) {
        query = query.gte('payment_date', filters.fromDate.toISOString());
      }

      if (filters.toDate) {
        query = query.lte('payment_date', filters.toDate.toISOString());
      }

      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `description.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`
        );
      }

      // Get total count and apply pagination
      const { data, error, count } = await query
        .order('payment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data as Payment[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Payment listing' });
      return null;
    }
  }

  /**
   * Get a single payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select(`
          *,
          lease:lease_id(agreement_number, customer_id, vehicle_id),
          lease.customers:customer_id(full_name),
          lease.vehicles(license_plate, make, model)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Payment;
    } catch (error) {
      handleError(error, { context: 'Payment details' });
      return null;
    }
  }
  /**
   * Create a new payment
   */
  async createPayment(data: PaymentInsert): Promise<Payment | null> {
    try {
      // Validate the input data
      const validatedData = validateData(paymentInsertSchema, data, { 
        context: 'Payment creation',
        throwOnError: true 
      });
      
      if (!validatedData) return null;
      
      const { data: newPayment, error } = await supabase
        .from('unified_payments')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newPayment as Payment;
    } catch (error) {
      handleError(error, { context: 'Create payment' });
      return null;
    }
  }
  /**
   * Update an existing payment
   */
  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment | null> {
    try {
      // Validate the input data
      const validatedData = validateData(paymentUpdateSchema, data, {
        context: 'Payment update',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      const { data: updatedPayment, error } = await supabase
        .from('unified_payments')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedPayment as Payment;
    } catch (error) {
      handleError(error, { context: 'Update payment' });
      return null;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: string): Promise<Payment | null> {
    try {
      const { data: deletedPayment, error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedPayment as Payment;
    } catch (error) {
      handleError(error, { context: 'Delete payment' });
      return null;
    }
  }
  /**
   * Process a special payment with late fee calculation
   */
  async processSpecialPayment(
    agreementId: string, 
    amount: number, 
    paymentDate: Date, 
    options?: SpecialPaymentOptions
  ): Promise<Payment | null> {
    try {
      // Validate options if provided
      if (options) {
        validateData(specialPaymentOptionsSchema, options, {
          context: 'Special payment options',
          throwOnError: true
        });
      }
      
      // Validate basic parameters
      if (!agreementId) throw new Error('Agreement ID is required');
      if (amount <= 0) throw new Error('Amount must be greater than zero');
      if (!(paymentDate instanceof Date)) throw new Error('Invalid payment date');
      
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
        throw new Error(`Error fetching lease data: ${leaseError.message}`);
      }
      
      const rentAmount = leaseData?.rent_amount || 0;
      
      // Calculate days late and late fee
      let daysLate = 0;
      let lateFineAmount = 0;
      
      if (includeLatePaymentFee && paymentDate.getDate() > 1) {
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
        original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString(),
        created_at: new Date().toISOString()
      };
      
      // Record the payment
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as Payment;
    } catch (error) {
      handleError(error, { context: 'Process special payment' });
      return null;
    }
  }

  /**
   * Get payment statistics for an agreement
   */
  async getPaymentStatistics(agreementId: string): Promise<{ 
    totalPaid: number;
    totalDue: number;
    totalLate: number;
    paymentCount: number;
    overdueCount: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_agreement_payment_statistics', { 
          agreement_id: agreementId 
        });

      if (error) {
        throw error;
      }

      return data || {
        totalPaid: 0,
        totalDue: 0,
        totalLate: 0,
        paymentCount: 0,
        overdueCount: 0
      };
    } catch (error) {
      handleError(error, { context: 'Payment statistics' });
      return null;
    }
  }

  /**
   * Generate scheduled payments for an agreement
   */
  async generateScheduledPayments(
    agreementId: string, 
    startDate: Date, 
    endDate: Date, 
    amount: number, 
    frequency: 'monthly' | 'weekly' | 'bi-weekly' = 'monthly'
  ): Promise<Payment[] | null> {
    try {
      const { data, error } = await supabase
        .rpc('generate_payment_schedule', {
          p_agreement_id: agreementId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_amount: amount,
          p_frequency: frequency
        });

      if (error) {
        throw error;
      }

      return data as Payment[];
    } catch (error) {
      handleError(error, { context: 'Generate payment schedule' });
      return null;
    }
  }
}

// Export a singleton instance
export const paymentService = new PaymentService();
