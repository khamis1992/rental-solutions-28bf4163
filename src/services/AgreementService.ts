
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { BaseService, handleServiceOperation, ServiceResult } from '@/services/base/BaseService';

// Define AgreementFilters interface
export interface AgreementFilters {
  status?: string;
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  end_date_after?: string;
  end_date_before?: string;
  [key: string]: any;
}

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
          .eq('id', asLeaseId(agreement.id!))
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
        .eq('id', asLeaseId(id));
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to delete agreement')
      };
    }
  },

  /**
   * Find agreements based on filters
   */
  async findAgreements(filters: AgreementFilters = {}): Promise<SaveResponse> {
    try {
      let query = supabase.from('leases').select(`
        *,
        customers:profiles(*),
        vehicles(*)
      `);
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }
      
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString());
      }
      
      if (filters.end_date_after) {
        query = query.gte('end_date', filters.end_date_after);
      }
      
      if (filters.end_date_before) {
        query = query.lte('end_date', filters.end_date_before);
      }
      
      if (filters.search) {
        // Enhanced search across multiple fields
        query = query.or(
          `agreement_number.ilike.%${filters.search}%,vehicles.license_plate.ilike.%${filters.search}%,profiles.full_name.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error finding agreements:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to find agreements')
      };
    }
  },

  /**
   * Get agreement details by ID
   */
  async getAgreementDetails(id: string): Promise<SaveResponse> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id(*),
          vehicles:vehicle_id(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting agreement details:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to get agreement details')
      };
    }
  },

  /**
   * Update agreement
   */
  async update(id: string, data: Record<string, any>): Promise<SaveResponse> {
    try {
      const { data: updatedData, error } = await supabase
        .from('leases')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Error updating agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to update agreement')
      };
    }
  },

  /**
   * Change agreement status
   */
  async changeStatus(id: string, status: string): Promise<SaveResponse> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error changing agreement status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to change agreement status')
      };
    }
  },

  /**
   * Delete agreement
   */
  async deleteAgreement(id: string): Promise<SaveResponse> {
    try {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to delete agreement')
      };
    }
  },

  /**
   * Calculate remaining amount
   */
  async calculateRemainingAmount(id: string): Promise<SaveResponse> {
    try {
      // This is a placeholder implementation - in reality you would need to implement this
      // based on your business logic and database structure
      const { data, error } = await supabase.rpc('calculate_remaining_amount', { agreement_id: id });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error calculating remaining amount:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to calculate remaining amount')
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
