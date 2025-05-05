
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asPaymentId, asLeaseId, asPaymentStatus } from '../database-types';
import { supabase } from '@/lib/supabase';

type PaymentRow = TableRow<'unified_payments'>;

/**
 * Repository for payment-related database operations
 */
export class PaymentRepository extends Repository<'unified_payments'> {
  constructor(client: any) {
    super(client, 'unified_payments');
  }

  /**
   * Find payments by lease ID
   */
  async findByLeaseId(leaseId: string): Promise<DbListResponse<PaymentRow>> {
    const response = await this.client
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asLeaseId(leaseId))
      .order('payment_date', { ascending: false });
    
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
}

// Export the repository instance and the factory function
export const paymentRepository = new PaymentRepository(supabase);
export const createPaymentRepository = (client: any) => new PaymentRepository(client);
