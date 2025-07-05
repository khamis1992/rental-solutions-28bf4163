
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createPaymentRepository(supabase: SupabaseClient<Database>) {
  return {
    async findByLeaseId(leaseId: string) {
      try {
        const { data, error } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', leaseId)
          .order('payment_date', { ascending: false });

        return { data, error };
      } catch (error) {
        console.error('Error in findByLeaseId:', error);
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async recordPayment(payment: any) {
      try {
        const { data, error } = await supabase
          .from('unified_payments')
          .insert([payment])
          .select()
          .single();

        return { data, error };
      } catch (error) {
        console.error('Error in recordPayment:', error);
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async update(id: string, updates: any) {
      try {
        const { data, error } = await supabase
          .from('unified_payments')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      } catch (error) {
        console.error('Error in update:', error);
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },

    async delete(id: string) {
      try {
        const { error } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', id);

        return { data: { success: true }, error };
      } catch (error) {
        console.error('Error in delete:', error);
        return { 
          data: null, 
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null,
            hint: null,
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    }
  };
}
