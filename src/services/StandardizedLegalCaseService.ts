/**
 * Standardized Legal Case Service
 * Handles legal case management and related operations
 */
import { supabase } from '@/lib/supabase';
import { BaseService } from './BaseService';
import { 
  LegalCase,
  LegalCaseStatus,
  LegalCaseType,
  CasePriority
} from '@/types/legal-case.types';
import { handleError } from '@/utils/error-handler';
import { validateData } from '@/utils/validation';
import {
  legalCaseSchema,
  legalCaseInsertSchema,
  legalCaseUpdateSchema
} from '@/schemas/legal-case.schema';

export interface PaginatedLegalCaseResult {
  data: LegalCase[];
  count: number;
}

/**
 * Service for managing legal cases
 */
export class LegalCaseService extends BaseService {
  constructor() {
    super('legal_cases');
  }

  /**
   * Get legal cases with filtering and pagination
   */
  async getLegalCases(
    filters: {
      customerId?: string;
      agreementId?: string;
      vehicleId?: string;
      status?: LegalCaseStatus | LegalCaseStatus[];
      type?: LegalCaseType | LegalCaseType[];
      priority?: CasePriority;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ): Promise<PaginatedLegalCaseResult | null> {
    try {
      // Start building the query
      let query = supabase.from('legal_cases').select(`
        *,
        customer:customer_id(*),
        agreement:agreement_id(*),
        vehicle:vehicle_id(*)
      `, { count: 'exact' });

      // Apply filters
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters.agreementId) {
        query = query.eq('agreement_id', filters.agreementId);
      }

      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('case_type', filters.type);
        } else {
          query = query.eq('case_type', filters.type);
        }
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.fromDate) {
        query = query.gte('filed_date', filters.fromDate.toISOString());
      }

      if (filters.toDate) {
        query = query.lte('filed_date', filters.toDate.toISOString());
      }

      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data as LegalCase[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Legal case listing' });
      return null;
    }
  }

  /**
   * Get a single legal case by ID
   */
  async getLegalCaseById(id: string): Promise<LegalCase | null> {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select(`
          *,
          customer:customer_id(*),
          agreement:agreement_id(*),
          vehicle:vehicle_id(*),
          documents:legal_case_documents(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as LegalCase;
    } catch (error) {
      handleError(error, { context: 'Legal case details' });
      return null;
    }
  }
  /**
   * Create a new legal case
   */
  async createLegalCase(data: Omit<LegalCase, 'id' | 'created_at' | 'updated_at'>): Promise<LegalCase | null> {
    try {
      // Validate the input data
      const validatedData = validateData(legalCaseInsertSchema, data, {
        context: 'Legal case creation',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      const { data: newCase, error } = await supabase
        .from('legal_cases')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newCase as LegalCase;
    } catch (error) {
      handleError(error, { context: 'Create legal case' });
      return null;
    }
  }
  /**
   * Update an existing legal case
   */
  async updateLegalCase(id: string, data: Partial<LegalCase>): Promise<LegalCase | null> {
    try {
      // Validate the input data
      const validatedData = validateData(legalCaseUpdateSchema, data, {
        context: 'Legal case update',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      const { data: updatedCase, error } = await supabase
        .from('legal_cases')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedCase as LegalCase;
    } catch (error) {
      handleError(error, { context: 'Update legal case' });
      return null;
    }
  }

  /**
   * Delete a legal case
   */
  async deleteLegalCase(id: string): Promise<LegalCase | null> {
    try {
      const { data: deletedCase, error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedCase as LegalCase;
    } catch (error) {
      handleError(error, { context: 'Delete legal case' });
      return null;
    }
  }

  /**
   * Get legal case statistics
   */
  async getLegalCaseStatistics(): Promise<{
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
    byType: Record<LegalCaseType, number>;
    byStatus: Record<LegalCaseStatus, number>;
    byPriority: Record<CasePriority, number>;
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_legal_case_statistics');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      handleError(error, { context: 'Legal case statistics' });
      return null;
    }
  }

  /**
   * Get legal cases for a specific customer
   */
  async getCustomerLegalCases(customerId: string): Promise<LegalCase[] | null> {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as LegalCase[];
    } catch (error) {
      handleError(error, { context: 'Customer legal cases' });
      return null;
    }
  }

  /**
   * Get legal cases for a specific agreement
   */
  async getAgreementLegalCases(agreementId: string): Promise<LegalCase[] | null> {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('agreement_id', agreementId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as LegalCase[];
    } catch (error) {
      handleError(error, { context: 'Agreement legal cases' });
      return null;
    }
  }
}

// Export a singleton instance
export const legalCaseService = new LegalCaseService();
