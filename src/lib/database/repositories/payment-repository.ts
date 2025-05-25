
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asPaymentId, asLeaseId, asPaymentStatus } from '../database-types';
import { supabase } from '@/lib/supabase';
import { isValidUUID } from '@/lib/uuid-validation';

type PaymentRow = TableRow<'unified_payments'>;

/**
 * Repository for payment-related database operations
 */
export class PaymentRepository extends Repository<'unified_payments'> {
  constructor(client: any) {
    super(client, 'unified_payments');
  }

  /**
   * Find payments by lease ID with validation
   */
  async findByLeaseId(leaseId: string | undefined | null): Promise<DbListResponse<PaymentRow>> {
    console.log('PaymentRepository.findByLeaseId called with:', leaseId);
    
    // Validate UUID before making the query
    if (!leaseId || !isValidUUID(leaseId)) {
      console.error('PaymentRepository.findByLeaseId: Invalid lease ID:', leaseId);
      return { 
        data: [], 
        error: {
          name: 'ValidationError',
          message: `Invalid lease ID format: ${leaseId}`,
          details: 'Lease ID must be a valid UUID',
          code: 'INVALID_UUID',
          hint: 'Check that the lease ID is properly formatted'
        }
      };
    }

    try {
      const validLeaseId = asLeaseId(leaseId);
      console.log('PaymentRepository.findByLeaseId: Making query with validated ID:', validLeaseId);
      
      const response = await this.client
        .from('unified_payments')
        .select('*')
        .eq('lease_id', validLeaseId)
        .order('payment_date', { ascending: false });
      
      console.log('PaymentRepository.findByLeaseId: Query response:', { data: response.data?.length, error: response.error });
      
      return { data: response.data || [], error: response.error };
    } catch (error) {
      console.error('PaymentRepository.findByLeaseId: Error:', error);
      return { 
        data: [], 
        error: {
          name: 'DatabaseError',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: '',
          code: '',
          hint: ''
        }
      };
    }
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
   * Record a payment
   */
  async recordPayment(paymentData: Partial<PaymentRow>): Promise<DbSingleResponse<PaymentRow>> {
    const response = await this.client
      .from('unified_payments')
      .insert([paymentData])
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update payment status
   */
  async updateStatus(paymentId: string, status: string): Promise<DbSingleResponse<PaymentRow>> {
    const response = await this.client
      .from('unified_payments')
      .update({ status: asPaymentStatus(status) })
      .eq('id', asPaymentId(paymentId))
      .select()
      .single();
    
    return { data: response.data, error: response.error };
  }

  /**
   * Update payment with validation
   */
  async update(paymentId: string | undefined | null, paymentData: Partial<PaymentRow>): Promise<DbSingleResponse<PaymentRow>> {
    if (!isValidUUID(paymentId)) {
      return {
        data: null,
        error: {
          name: 'InvalidPaymentId',
          message: `Invalid payment ID: ${paymentId}`,
          details: 'Payment ID must be a valid UUID',
          code: 'INVALID_UUID',
          hint: 'Check that the payment ID is properly formatted'
        }
      };
    }

    try {
      const safePaymentId = asPaymentId(paymentId);
      const response = await this.client
        .from('unified_payments')
        .update(paymentData)
        .eq('id', safePaymentId)
        .select()
        .single();
      
      return { data: response.data, error: response.error };
    } catch (error) {
      return {
        data: null,
        error: {
          name: 'DatabaseError',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: '',
          code: '',
          hint: ''
        }
      };
    }
  }
}

// Export the repository instance and the factory function
export const paymentRepository = new PaymentRepository(supabase);
export const createPaymentRepository = (client: any) => new PaymentRepository(client);
