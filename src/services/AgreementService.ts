import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { ensureValidLeaseStatus } from '@/types/lease-types';
import { BaseService, handleServiceOperation, ServiceResult } from '@/services/base/BaseService';
import { agreementDeletionService } from './AgreementDeletionService';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

// Define AgreementFilters interface
export interface AgreementFilters {
  statuses?: string[];  // Array of statuses for filtering
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
   * Delete agreement with proper cascade handling
   */
  async deleteAgreement(id: string): Promise<SaveResponse> {
    try {
      // Use the new deletion service for proper cascade handling
      const result = await agreementDeletionService.deleteAgreement(id);
      
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete agreement');
      }
      
      return { 
        success: true, 
        data: result.data 
      };
    } catch (error) {
      console.error('Error deleting agreement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to delete agreement')
      };
    }
  },

  /**
   * Legacy delete method (deprecated)
   */
  async delete(id: string): Promise<SaveResponse> {
    return this.deleteAgreement(id);
  },

  /**
   * Find agreements based on filters
   */
  async findAgreements(filters: AgreementFilters = {}): Promise<SaveResponse> {
    try {
      const selectClause = `
        *,
        customers:profiles(*),
        vehicles${filters.license_plate ? '!inner' : ''}(*)
      `;
      let query = supabase.from('leases').select(selectClause);
      
      // Apply filters
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
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
      }

      // Search by customer name or vehicle license plate
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
          customers:profiles(*),
          vehicles:vehicles(*)
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

export class AgreementService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchAgreements(filters?: AgreementFilters): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('leases').select('*');

      if (filters) {
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.statuses && filters.statuses.length > 0) {
          query = query.in('status', filters.statuses);
        }
        
        if (filters.startDate && filters.endDate) {
          query = query.gte('start_date', filters.startDate.toISOString()).lte('end_date', filters.endDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch agreements',
          'AgreementService',
          'fetchAgreements'
        );
      }

      return data as Agreement[];
    }, 'Failed to fetch agreements');
  }

  async getAgreementById(id: string): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch agreement',
          'AgreementService',
          'getAgreementById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Agreement not found',
          'AgreementService',
          'getAgreementById'
        );
      }

      return data;
    }, 'Failed to fetch agreement');
  }

  async createAgreement(agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .insert([agreementData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create agreement',
          'AgreementService',
          'createAgreement'
        );
      }

      return data;
    }, 'Failed to create agreement');
  }

  async updateAgreement(id: string, agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .update(agreementData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update agreement',
          'AgreementService',
          'updateAgreement'
        );
      }

      if (!data) {
        throw createServiceError(
          'Agreement not found',
          'AgreementService',
          'updateAgreement'
        );
      }

      return data;
    }, 'Failed to update agreement');
  }

  async deleteAgreement(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete agreement',
          'AgreementService',
          'deleteAgreement'
        );
      }

      return true;
    }, 'Failed to delete agreement');
  }

  async getAgreementsByCustomer(customerId: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ customerId });
  }

  async getAgreementsByVehicle(vehicleId: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ vehicleId });
  }

  async getAgreementsByStatus(status: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ statuses: [status] });
  }

  async getAgreementsByDateRange(startDate: string, endDate: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ startDate, endDate });
  }
}
