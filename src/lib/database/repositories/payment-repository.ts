
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asPaymentId, asLeaseId, asPaymentStatus } from '../database-types';
import { supabase } from '@/lib/supabase';
import { isValidUuid } from '@/types/db';

type PaymentRow = TableRow<'unified_payments'>;

/**
 * Repository for payment-related database operations
 */
export class PaymentRepository extends Repository<'unified_payments'> {
  constructor(client: any) {
    super(client, 'unified_payments');
  }

  /**
   * Find payments by lease ID with proper UUID validation
   */
  async findByLeaseId(leaseId: string): Promise<DbListResponse<PaymentRow>> {
    console.log('PaymentRepository.findByLeaseId called with:', leaseId);
    
    if (!leaseId || leaseId === 'undefined' || !isValidUuid(leaseId)) {
      console.error('Invalid lease ID provided to findByLeaseId:', leaseId);
      return {
        data: null,
        error: {
          name: 'ValidationError',
          message: 'Invalid lease ID format',
          details: `Provided lease ID "${leaseId}" is not a valid UUID`,
          code: 'INVALID_UUID',
          hint: 'Ensure the lease ID is a valid UUID string'
        }
      };
    }

    const response = await this.client
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asLeaseId(leaseId))
      .order('payment_date', { ascending: false });
    
    console.log('PaymentRepository.findByLeaseId response:', response);
    return { data: response.data, error: response.error };
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: string): Promise<DbListResponse<PaymentRow>> {
    const response = await this.client
      .from('unified_payments')
      .select('*')
      .eq('status', asPaymentStatus(status))
      .order('payment_date', { ascending: false });
    
    return { data: response.data, error: response.error };
  }

  /**
   * Record a payment with proper validation
   */
  async recordPayment(paymentData: Partial<PaymentRow>): Promise<DbSingleResponse<PaymentRow>> {
    console.log('PaymentRepository.recordPayment called with:', paymentData);
    
    // Validate lease_id if provided
    if (paymentData.lease_id && !isValidUuid(paymentData.lease_id)) {
      console.error('Invalid lease_id in payment data:', paymentData.lease_id);
      return {
        data: null,
        error: {
          name: 'ValidationError',
          message: 'Invalid lease ID in payment data',
          details: `Lease ID "${paymentData.lease_id}" is not a valid UUID`,
          code: 'INVALID_UUID',
          hint: 'Ensure the lease ID is a valid UUID string'
        }
      };
    }

    const response = await this.client
      .from('unified_payments')
      .insert([paymentData])
      .select()
      .single();
    
    console.log('PaymentRepository.recordPayment response:', response);
    return { data: response.data, error: response.error };
  }

  /**
   * Update payment status
   */
  async updateStatus(paymentId: string, status: string): Promise<DbSingleResponse<PaymentRow>> {
    if (!paymentId || !isValidUuid(paymentId)) {
      console.error('Invalid payment ID provided to updateStatus:', paymentId);
      return {
        data: null,
        error: {
          name: 'ValidationError',
          message: 'Invalid payment ID format',
          details: `Payment ID "${paymentId}" is not a valid UUID`,
          code: 'INVALID_UUID',
          hint: 'Ensure the payment ID is a valid UUID string'
        }
      };
    }

    const response = await this.client
      .from('unified_payments')
      .update({ status: asPaymentStatus(status) })
      .eq('id', asPaymentId(paymentId))
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update payment
   * This overrides the base update method to ensure proper handling of payment updates
   */
  async update(paymentId: string, paymentData: Partial<PaymentRow>): Promise<DbSingleResponse<PaymentRow>> {
    console.log('PaymentRepository.update called with:', paymentId, paymentData);
    
    if (!paymentId || paymentId === 'undefined' || !isValidUuid(paymentId)) {
      console.error('Invalid payment ID provided to update:', paymentId);
      return {
        data: null,
        error: {
          name: 'ValidationError',
          message: 'Invalid payment ID format',
          details: `Payment ID "${paymentId}" is not a valid UUID`,
          code: 'INVALID_UUID',
          hint: 'Ensure the payment ID is a valid UUID string'
        }
      };
    }
    
    const safePaymentId = asPaymentId(paymentId);
    
    const response = await this.client
      .from('unified_payments')
      .update(paymentData)
      .eq('id', safePaymentId)
      .select()
      .single();
    
    console.log('PaymentRepository.update response:', response);
    return { data: response.data, error: response.error };
  }
}

// Export the repository instance and the factory function
export const paymentRepository = new PaymentRepository(supabase);
export const createPaymentRepository = (client: any) => new PaymentRepository(client);
