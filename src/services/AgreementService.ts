
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asAgreementId } from '@/utils/database-type-helpers';

interface SaveResponse {
  success: boolean;
  data?: any;
  error?: Error;
}

export const agreementService = {
  /**
   * Save agreement (create or update)
   */
  async save(agreement: Agreement): Promise<SaveResponse> {
    try {
      // Determine if this is a create or update operation
      const isUpdate = Boolean(agreement.id);
      
      if (isUpdate) {
        // Update existing agreement
        const { data, error } = await supabase
          .from('leases')
          .update({
            vehicle_id: agreement.vehicle_id,
            customer_id: agreement.customer_id,
            start_date: agreement.start_date,
            end_date: agreement.end_date,
            status: agreement.status,
            deposit_amount: agreement.deposit_amount,
            total_amount: agreement.total_amount,
            notes: agreement.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', asAgreementId(agreement.id!))
          .select()
          .single();
          
        if (error) throw error;
        
        return { success: true, data };
      } else {
        // Create new agreement
        const { data, error } = await supabase
          .from('leases')
          .insert({
            vehicle_id: agreement.vehicle_id,
            customer_id: agreement.customer_id,
            agreement_number: agreement.agreement_number || generateAgreementNumber(),
            start_date: agreement.start_date,
            end_date: agreement.end_date,
            status: agreement.status,
            deposit_amount: agreement.deposit_amount,
            total_amount: agreement.total_amount,
            notes: agreement.notes
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return { success: true, data };
      }
    } catch (error) {
      console.error('Error saving agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to save agreement')
      };
    }
  },
  
  /**
   * Delete agreement
   */
  async delete(id: string): Promise<SaveResponse> {
    try {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', asAgreementId(id));
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to delete agreement')
      };
    }
  }
};

// Helper function to generate an agreement number
function generateAgreementNumber(): string {
  const prefix = 'AGR';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}
