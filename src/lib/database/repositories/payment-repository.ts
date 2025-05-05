
import { Repository } from '../repository';
import { Tables, TableRow, DbListResponse, DbSingleResponse } from '../types';
import { asPaymentId, asLeaseId } from '../database-types';
import { supabase } from '@/lib/supabase';

type PaymentRow = TableRow<'unified_payments'>;

class PaymentRepository extends Repository<'unified_payments'> {
  constructor() {
    super('unified_payments');
  }

  /**
   * Find payments by lease ID
   */
  async findByLeaseId(leaseId: string): Promise<DbListResponse<PaymentRow>> {
    const response = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asLeaseId(leaseId))
      .order('payment_date', { ascending: false });
    
    return this.mapDbResponse(response);
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: string): Promise<DbListResponse<PaymentRow>> {
    const response = await supabase
      .from('unified_payments')
      .select('*')
      .eq('status', status)
      .order('payment_date', { ascending: false });
    
    return this.mapDbResponse(response);
  }

  /**
   * Record a payment
   */
  async recordPayment(paymentData: Partial<PaymentRow>): Promise<DbSingleResponse<PaymentRow>> {
    const response = await supabase
      .from('unified_payments')
      .insert([paymentData])
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }

  /**
   * Update payment status
   */
  async updateStatus(paymentId: string, status: string): Promise<DbSingleResponse<PaymentRow>> {
    const response = await supabase
      .from('unified_payments')
      .update({ status })
      .eq('id', asPaymentId(paymentId))
      .select()
      .single();
    
    return this.mapDbResponse(response);
  }
}

export const paymentRepository = new PaymentRepository();
export const createPaymentRepository = () => new PaymentRepository();
