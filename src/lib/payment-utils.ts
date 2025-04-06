
import { supabase } from '@/lib/supabase';
import { SimpleAgreement } from '@/hooks/use-agreements';

/**
 * Reconcile payments for an agreement
 * @param agreement The agreement to reconcile payments for
 * @param amount Optional amount for a new payment
 * @param paymentDate Optional payment date
 * @param paymentMethod Optional payment method
 * @param description Optional description
 * @returns Updated payments array
 */
export const reconcilePayments = async (
  agreement: SimpleAgreement,
  amount?: number,
  paymentDate?: Date,
  paymentMethod?: string,
  description?: string
) => {
  try {
    // Create a new payment if amount is provided
    if (amount && paymentDate) {
      const { data, error } = await supabase.from('unified_payments').insert([
        {
          lease_id: agreement.id,
          amount: amount,
          amount_paid: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod || 'cash',
          status: 'paid',
          type: 'Income',
          description: description || `Payment on ${paymentDate.toISOString().split('T')[0]}`,
          transaction_id: `TXN-${Date.now()}`
        }
      ]).select('*');

      if (error) {
        throw error;
      }
    }

    // Fetch and return all payments for this agreement
    const { data: updatedPayments, error: fetchError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .order('payment_date', { ascending: false });
      
    if (fetchError) {
      throw fetchError;
    }
    
    return updatedPayments;
  } catch (error) {
    console.error('Error reconciling payments:', error);
    throw error;
  }
};
