
/**
 * Standardized AgreementService for the Fleet Management System
 */
import { supabase } from '@/lib/supabase';
import { BaseService } from './BaseService';
import { Agreement, AgreementDetail, TableFilters } from '@/types/agreement';
import { handleError } from '@/utils/error-handler';

export interface PaginatedAgreementResult {
  data: Agreement[];
  count: number;
}

// Helper function to generate agreement numbers
function generateAgreementNumber(): string {
  const prefix = 'RENT';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Service for managing rental agreements 
 */
export class AgreementService extends BaseService {
  constructor() {
    super('leases');
  }

  /**
   * Get agreements with filtering and pagination
   */
  async getAgreements(
    filters: TableFilters = {},
    limit = 10,
    offset = 0
  ): Promise<PaginatedAgreementResult | null> {
    try {
      // Start building the query
      let query = supabase.from('leases').select(`
        *,
        customers:profiles(*),
        vehicles(*)
      `, { count: 'exact' });

      // Apply status filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply date range filters
      if (filters.date && filters.date[0] && filters.date[1]) {
        query = query
          .gte('start_date', filters.date[0].toISOString())
          .lte('end_date', filters.date[1].toISOString());
      }

      // Apply vehicle filter
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      // Apply customer filter
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      // Apply search filter
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.trim();
        query = query.or(
          `agreement_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      // Get total count and apply pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Format the data to match the Agreement interface
      const formattedData = data.map(item => ({
        ...item,
        customer_name: item.customers?.full_name || 'Unknown',
        license_plate: item.vehicles?.license_plate || 'N/A',
        vehicle_make: item.vehicles?.make || 'N/A',
        vehicle_model: item.vehicles?.model || 'N/A'
      })) as Agreement[];

      return {
        data: formattedData,
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Agreement listing' });
      return null;
    }
  }

  /**
   * Get a single agreement by ID
   */
  async getAgreementById(id: string): Promise<AgreementDetail | null> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*),
          payments:unified_payments(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // Format the data to match the AgreementDetail interface
      const agreement: AgreementDetail = {
        ...data,
        customer_name: data.customers?.full_name || 'Unknown',
        license_plate: data.vehicles?.license_plate || 'N/A',
        vehicle_make: data.vehicles?.make || 'N/A',
        vehicle_model: data.vehicles?.model || 'N/A',
        payments: data.payments || []
      };

      return agreement;
    } catch (error) {
      handleError(error, { context: 'Agreement details' });
      return null;
    }
  }

  /**
   * Create a new agreement
   */
  async createAgreement(data: Partial<Agreement>): Promise<Agreement | null> {
    try {
      // Generate agreement number if not provided
      const agreementData = {
        ...data,
        agreement_number: data.agreement_number || generateAgreementNumber(),
        created_at: new Date().toISOString()
      };

      const { data: newAgreement, error } = await supabase
        .from('leases')
        .insert(agreementData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newAgreement as Agreement;
    } catch (error) {
      handleError(error, { context: 'Create agreement' });
      return null;
    }
  }

  /**
   * Update an existing agreement
   */
  async updateAgreement(id: string, data: Partial<Agreement>): Promise<Agreement | null> {
    try {
      const { data: updatedAgreement, error } = await supabase
        .from('leases')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedAgreement as Agreement;
    } catch (error) {
      handleError(error, { context: 'Update agreement' });
      return null;
    }
  }

  /**
   * Delete an agreement
   */
  async deleteAgreement(id: string): Promise<Agreement | null> {
    try {
      const { data: deletedAgreement, error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedAgreement as Agreement;
    } catch (error) {
      handleError(error, { context: 'Delete agreement' });
      return null;
    }
  }

  /**
   * Update agreement status
   */
  async updateAgreementStatus(id: string, status: string): Promise<Agreement | null> {
    try {
      const { data: updatedAgreement, error } = await supabase
        .from('leases')
        .update({
          status,
          status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedAgreement as Agreement;
    } catch (error) {
      handleError(error, { context: 'Update agreement status' });
      return null;
    }
  }

  /**
   * Get agreements expiring soon
   */
  async getExpiringAgreements(daysThreshold = 7): Promise<Agreement[] | null> {
    try {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(full_name),
          vehicles(license_plate, make, model)
        `)
        .eq('status', 'active')
        .lte('end_date', thresholdDate.toISOString())
        .gte('end_date', today.toISOString())
        .order('end_date', { ascending: true });

      if (error) {
        throw error;
      }

      // Format the data
      return data.map(item => ({
        ...item,
        customer_name: item.customers?.full_name || 'Unknown',
        license_plate: item.vehicles?.license_plate || 'N/A',
        vehicle_make: item.vehicles?.make || 'N/A',
        vehicle_model: item.vehicles?.model || 'N/A'
      })) as Agreement[];
    } catch (error) {
      handleError(error, { context: 'Expiring agreements' });
      return null;
    }
  }
}

// Export a singleton instance
export const agreementService = new AgreementService();
