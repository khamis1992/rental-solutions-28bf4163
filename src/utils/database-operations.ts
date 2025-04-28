
import { supabase } from '@/integrations/supabase/client';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';
import { 
  asLeaseId, 
  asPaymentId, 
  isValidResponse, 
  castPaymentUpdate 
} from '@/utils/database-type-helpers';

/**
 * Function to safely create a payment update object
 * @param data Partial payment data
 * @returns Typed payment update object
 */
export function createPaymentUpdate(data: Partial<ExtendedPayment>) {
  const update = castPaymentUpdate({});
  
  // Only include properties that exist in PaymentUpdate
  if (data.amount !== undefined) update.amount = data.amount;
  if (data.amount_paid !== undefined) update.amount_paid = data.amount_paid;
  if (data.balance !== undefined) update.balance = data.balance;
  if (data.payment_method !== undefined) update.payment_method = data.payment_method;
  if (data.status !== undefined) update.status = data.status;
  if (data.description !== undefined) update.description = data.description;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.due_date !== undefined) update.due_date = data.due_date;
  if (data.payment_date !== undefined) update.payment_date = data.payment_date;
  if (data.original_due_date !== undefined) update.original_due_date = data.original_due_date;
  if (data.late_fine_amount !== undefined) update.late_fine_amount = data.late_fine_amount;
  if (data.days_overdue !== undefined) update.days_overdue = data.days_overdue;
  if (data.is_recurring !== undefined) update.is_recurring = data.is_recurring;
  if (data.type !== undefined) update.type = data.type;
  
  return update;
}

/**
 * Update a unified payment with proper typing
 * @param paymentId Payment ID
 * @param updateData Payment data to update
 * @returns Promise with success status and data
 */
export const updateUnifiedPayment = async (paymentId: string, updateData: Partial<ExtendedPayment>) => {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .update(createPaymentUpdate(updateData))
      .eq('id', asPaymentId(paymentId))
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

/**
 * Fetch unified payments for a lease
 * @param leaseId Lease ID
 * @returns Promise with array of extended payments
 */
export const fetchUnifiedPayments = async (leaseId: string): Promise<ExtendedPayment[]> => {
  try {
    const response = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asLeaseId(leaseId));
      
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
      original_due_date: payment.original_due_date || null,
      due_date: payment.due_date || null,
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

/**
 * Update lease data with proper typing
 * @param leaseId Lease ID
 * @param updateData Lease data to update
 * @returns Promise with success status and data
 */
export const updateLease = async (leaseId: string, updateData: any) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .update(updateData)
      .eq('id', asLeaseId(leaseId))
      .select();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating lease:', error);
    throw error;
  }
};
