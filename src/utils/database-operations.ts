
import { supabase } from '@/integrations/supabase/client';
import { 
  castDatabaseId, 
  asLeaseId, 
  asPaymentId, 
  castPaymentUpdate
} from './database-type-helpers';
import { Database } from '@/types/database.types';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';

type Tables = Database['public']['Tables'];

// Unified payment functions
export const updateUnifiedPayment = async (paymentId: string, updateData: Partial<ExtendedPayment>) => {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .update(castPaymentUpdate({
        amount: updateData.amount,
        amount_paid: updateData.amount_paid,
        balance: updateData.balance,
        payment_method: updateData.payment_method,
        status: updateData.status,
        description: updateData.description,
        reference_number: updateData.reference_number,
        notes: updateData.notes
      }))
      .eq('id', castDatabaseId<'unified_payments'>(paymentId))
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

// Fetch payments with proper typing
export const fetchUnifiedPayments = async (leaseId: string): Promise<ExtendedPayment[]> => {
  try {
    const response = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', castDatabaseId<'leases'>(leaseId));
      
    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch payments');
    }
    
    const safeData = response.data || [];
    
    // Map to ensure all fields have valid defaults
    return safeData.map(payment => ({
      id: payment.id || '',
      lease_id: payment.lease_id || '',
      amount: payment.amount || 0,
      amount_paid: payment.amount_paid || 0,
      balance: payment.balance || 0,
      payment_date: payment.payment_date || null,
      payment_method: payment.payment_method || null,
      description: payment.description || null,
      status: payment.status || '',
      created_at: payment.created_at || '',
      updated_at: payment.updated_at || '',
      original_due_date: payment.original_due_date || '',
      due_date: payment.due_date || '',
      is_recurring: payment.is_recurring || false,
      type: payment.type || '',
      days_overdue: payment.days_overdue || 0,
      late_fine_amount: payment.late_fine_amount || 0,
      processing_fee: payment.processing_fee || 0,
      processed_by: payment.processed_by || '',
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    }));
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};
