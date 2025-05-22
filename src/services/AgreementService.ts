import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { ensureValidLeaseStatus } from '@/types/lease-types';
import { BaseService, handleServiceOperation, ServiceResult } from '@/services/base/BaseService';

// Define AgreementFilters interface
export interface AgreementFilters {
  status?: string;
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;  // Changed from 'search' to 'searchTerm' to match CustomerService
  /** Advanced filter fields */
  agreement_number?: string;
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  rent_min?: number;
  rent_max?: number;
  license_plate?: string;
  /** Pagination parameters */
  limit?: number;
  offset?: number;
  page?: number;
  [key: string]: any;
}

interface SaveResponse {
  success: boolean;
  data?: any;
  error?: Error;
  count?: number;
}

export const agreementService = {
  /**
   * Save agreement (create or update)
   */
  async save(agreement: Agreement): Promise<SaveResponse> {
    try {
      // Determine if this is a create or update operation
      const isUpdate = Boolean(agreement.id);

      // Calculate agreement duration if not provided
      if (!agreement.agreement_duration && agreement.start_date && agreement.end_date) {
        const startDate = new Date(agreement.start_date);
        const endDate = new Date(agreement.end_date);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        agreement.agreement_duration = `${diffDays} days`;
      }
      
      if (isUpdate) {
        // Update existing agreement
        const { data, error } = await supabase
          .from('leases')
          .update({
            vehicle_id: agreement.vehicle_id,
            customer_id: agreement.customer_id,
            agreement_number:
              agreement.agreement_number || generateAgreementNumber(),
            start_date: agreement.start_date,
            end_date: agreement.end_date,
            status: ensureValidLeaseStatus(agreement.status),
            deposit_amount: agreement.deposit_amount,
            total_amount: agreement.total_amount,
            rent_amount: agreement.rent_amount,
            daily_late_fee: agreement.daily_late_fee,
            agreement_type: agreement.agreement_type || 'short_term',
            agreement_duration: agreement.agreement_duration,
            rent_due_day:
              (agreement as any).payment_day ?? (agreement as any).rent_due_day,
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
            agreement_number:
              agreement.agreement_number || generateAgreementNumber(),
            start_date: agreement.start_date,
            end_date: agreement.end_date,
            status: ensureValidLeaseStatus(agreement.status),
            deposit_amount: agreement.deposit_amount,
            total_amount: agreement.total_amount,
            rent_amount: agreement.rent_amount,
            daily_late_fee: agreement.daily_late_fee,
            agreement_type: agreement.agreement_type || 'short_term', // Changed default from 'rental' to 'short_term'
            agreement_duration: agreement.agreement_duration,
            rent_due_day:
              (agreement as any).payment_day ?? (agreement as any).rent_due_day,
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
      const limit = filters.limit || 25;
      const offset = filters.offset || 0;
      
      const selectClause = `
        id, status, customer_id, vehicle_id, start_date, end_date, 
        created_at, updated_at, total_amount, agreement_number, 
        agreement_type, payment_frequency, payment_day,
        customers:profiles(id, full_name),
        vehicles${filters.license_plate ? '!inner' : ''}(id, make, model, license_plate, year, color)
      `;
      let query = supabase.from('leases').select(selectClause, { count: 'exact' });
      
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

      if (filters.agreement_number) {
        query = query.ilike('agreement_number', `%${filters.agreement_number}%`);
      }

      if (filters.start_date_after) {
        query = query.gte('start_date', filters.start_date_after);
      }

      if (filters.start_date_before) {
        query = query.lte('start_date', filters.start_date_before);
      }

      if (filters.rent_min !== undefined) {
        query = query.gte('rent_amount', filters.rent_min);
      }

      if (filters.rent_max !== undefined) {
        query = query.lte('rent_amount', filters.rent_max);
      }

      if (filters.license_plate) {
        query = query.ilike('vehicles.license_plate', `%${filters.license_plate}%`);
      }
      
      if (filters.end_date_after) {
        query = query.gte('end_date', filters.end_date_after);
      }
      
      if (filters.end_date_before) {
        query = query.lte('end_date', filters.end_date_before);
      }      // Search by customer name or vehicle license plate
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        
        // We need to search in both related tables using separate queries then combine results
        // First, get agreements that match by customer name
        const { data: customerMatches, error: customerError } = await supabase
          .from('leases')
          .select(`
            *,
            customers:profiles(*),
            vehicles(*)
          `)
          .ilike('profiles.full_name', `%${searchTerm}%`);
          
        // Second, get agreements that match by license plate
        const { data: vehicleMatches, error: vehicleError } = await supabase
          .from('leases')
          .select(`
            *,
            customers:profiles(*),
            vehicles(*)
          `)
          .ilike('vehicles.license_plate', `%${searchTerm}%`);
          
        // Merge and deduplicate the results
        if (customerMatches || vehicleMatches) {
          const mergedData = [...(customerMatches || []), ...(vehicleMatches || [])];
          
          // Deduplicate by agreement id
          const uniqueData = Array.from(
            new Map(mergedData.map(item => [item.id, item])).values()
          );
          
          return { success: true, data: uniqueData };
        }
            // If no matches found, return empty array
        return { success: true, data: [] };
      }

      // For other filter cases, continue with the original query
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data, count };
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
      const { data, error } = await supabase.rpc('calculate_remaining_amount', { lease_id: id });
      
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
