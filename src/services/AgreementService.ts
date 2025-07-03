import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asLeaseId } from '@/utils/database-type-helpers';
import { ensureValidLeaseStatus } from '@/types/lease-types';
import { BaseService } from '@/services/base/BaseService';
import { agreementDeletionService } from './AgreementDeletionService';
import { Result } from '@/types/response.types';
import { 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';
import { AgreementStatus } from '@/types/agreement.types';
import { PaymentStatus } from '@/types/payment.types';

// Define pagination interfaces
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Enhanced AgreementFilters interface with pagination
export interface AgreementFilters extends PaginationParams {
  statuses?: AgreementStatus[];  
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;  
  /** Advanced filter fields */
  agreement_number?: string;
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  created_date_after?: string;
  created_date_before?: string;
  rent_min?: number;
  rent_max?: number;
  license_plate?: string;
  isActive?: boolean;
  paymentStatus?: PaymentStatus;
  hasOverduePayments?: boolean;
  hasActiveMaintenance?: boolean;
  hasOpenLegalCases?: boolean;
  // Performance optimization fields
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelations?: boolean;
}

export class AgreementService extends BaseService {
  constructor() {
    super(supabase);
  }

  /**
   * Enhanced fetch agreements with pagination and performance optimizations
   */
  async fetchAgreementsPaginated(filters?: AgreementFilters): Promise<Result<PaginatedResult<Agreement>>> {
    return this.safeExecute(async () => {
      const {
        page = 1,
        pageSize = 25,
        sortBy = 'created_at',
        sortOrder = 'desc',
        includeRelations = true,
        ...restFilters
      } = filters || {};

      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      // Build select clause based on includeRelations
      const selectClause = includeRelations 
        ? `
          *,
          customers:profiles(*),
          vehicles${restFilters?.license_plate ? '!inner' : ''}(*)
        `
        : `*`;

      // First, get total count for pagination (optimized query)
      let countQuery = supabase
        .from('leases')
        .select('id', { count: 'exact', head: true });

      // Apply filters to count query
      countQuery = this.applyFiltersToQuery(countQuery, restFilters);

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Count query failed: ${countError.message}`);
      }

      const totalPages = Math.ceil((totalCount || 0) / pageSize);

      // If no results, return early
      if (totalCount === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Main data query with pagination
      let dataQuery = supabase
        .from('leases')
        .select(selectClause)
        .range(offset, offset + limit - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply filters to data query
      dataQuery = this.applyFiltersToQuery(dataQuery, restFilters);

      const { data, error } = await dataQuery;

      if (error) {
        throw new Error(`Data query failed: ${error.message}`);
      }

      return {
        data: data as Agreement[],
        totalCount: totalCount || 0,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    });
  }

  /**
   * Optimized search with pagination
   */
  async searchAgreementsPaginated(
    searchTerm: string, 
    filters?: Omit<AgreementFilters, 'searchTerm'>
  ): Promise<Result<PaginatedResult<Agreement>>> {
    return this.safeExecute(async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        return this.fetchAgreementsPaginated(filters);
      }

      const {
        page = 1,
        pageSize = 25,
        sortBy = 'created_at',
        sortOrder = 'desc',
        ...restFilters
      } = filters || {};

      const searchTermTrimmed = searchTerm.trim();
      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      // Parallel search across different fields for better performance
      const [agreementResults, vehicleResults, customerResults] = await Promise.all([
        // Search by agreement number
        this.searchByAgreementNumber(searchTermTrimmed, offset, limit),
        // Search by vehicle license plate
        this.searchByVehiclePlate(searchTermTrimmed, offset, limit),
        // Search by customer name
        this.searchByCustomerName(searchTermTrimmed, offset, limit)
      ]);

      // Combine and deduplicate results
      const combinedResults = [
        ...(agreementResults.data || []),
        ...(vehicleResults.data || []),
        ...(customerResults.data || [])
      ];

      // Remove duplicates based on agreement ID
      const uniqueResults = combinedResults.filter((agreement, index, self) => 
        index === self.findIndex((a) => a.id === agreement.id)
      );

      // Apply additional filters if provided
      let filteredResults = uniqueResults;
      if (Object.keys(restFilters).length > 0) {
        filteredResults = this.applyClientSideFilters(uniqueResults, restFilters);
      }

      // Sort results
      filteredResults.sort((a, b) => {
        const aValue = a[sortBy as keyof Agreement];
        const bValue = b[sortBy as keyof Agreement];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Calculate pagination for combined results
      const totalCount = filteredResults.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const paginatedResults = filteredResults.slice(offset, offset + limit);

      return {
        data: paginatedResults,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    });
  }

  /**
   * Legacy method for backward compatibility
   */
  async fetchAgreements(filters?: AgreementFilters): Promise<Result<Agreement[]>> {
    const result = await this.fetchAgreementsPaginated({
      ...filters,
      pageSize: 1000, // Large page size for backward compatibility
      includeRelations: true
    });
    
    if (!result.success) {
      return result as Result<Agreement[]>;
    }
    
    return {
      success: true,
      data: result.data.data
    };
  }

  /**
   * Helper method to apply filters to Supabase query
   */
  private applyFiltersToQuery(query: any, filters: Omit<AgreementFilters, keyof PaginationParams>) {
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

    if (filters.created_date_after) {
      query = query.gte('created_at', filters.created_date_after);
    }

    if (filters.created_date_before) {
      query = query.lte('created_at', filters.created_date_before);
    }

    if (filters.rent_min !== undefined) {
      query = query.gte('rent_amount', filters.rent_min);
    }

    if (filters.rent_max !== undefined) {
      query = query.lte('rent_amount', filters.rent_max);
    }

    if (filters.license_plate) {
      query = query.eq('vehicles.license_plate', filters.license_plate);
    }

    return query;
  }

  /**
   * Optimized search by agreement number
   */
  private async searchByAgreementNumber(searchTerm: string, offset: number, limit: number) {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .ilike('agreement_number', `%${searchTerm}%`)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Optimized search by vehicle license plate
   */
  private async searchByVehiclePlate(searchTerm: string, offset: number, limit: number) {
    return this.safeExecute(async () => {
      // First get vehicle IDs matching the search term
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .ilike('license_plate', `%${searchTerm}%`);

      if (vehicleError || !vehicles?.length) {
        return [];
      }

      const vehicleIds = vehicles.map(v => v.id);

      // Then get agreements for these vehicles
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .in('vehicle_id', vehicleIds)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Optimized search by customer name
   */
  private async searchByCustomerName(searchTerm: string, offset: number, limit: number) {
    return this.safeExecute(async () => {
      // First get customer IDs matching the search term
      const { data: customers, error: customerError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${searchTerm}%`);

      if (customerError || !customers?.length) {
        return [];
      }

      const customerIds = customers.map(c => c.id);

      // Then get agreements for these customers
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .in('customer_id', customerIds)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Apply client-side filters for complex filtering
   */
  private applyClientSideFilters(agreements: Agreement[], filters: any): Agreement[] {
    return agreements.filter(agreement => {
      // Apply any additional complex filters here
      if (filters.isActive !== undefined) {
        const isActive = agreement.status === 'active';
        if (filters.isActive !== isActive) return false;
      }

      // Add more complex filters as needed
      return true;
    });
  }

  async getAgreementById(id: string): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to fetch agreement',
          'getAgreementById'
        );
      }

      if (!data) {
        throw createNotFoundError('Agreement not found', { id });
      }

      return data;
    }, 'Failed to fetch agreement');
  }

  private async generateAgreementNumber(): Promise<string> {
    console.log('Generating new agreement number...');
    
    try {
      // Use the atomic Postgres function to get the next agreement number
      const { data, error } = await supabase.rpc('get_next_agreement_number');
      
      if (error) {
        console.error('Error calling get_next_agreement_number:', error);
        throw new Error(`Failed to generate agreement number: ${error.message}`);
      }
      
      if (!data) {
        console.error('No data returned from get_next_agreement_number');
        throw new Error('Failed to generate agreement number: No data returned');
      }
      
      console.log('Generated agreement number:', data);
      return data;
    } catch (error) {
      console.error('Exception in generateAgreementNumber:', error);
      throw new Error(`Failed to generate agreement number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createAgreement(agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      // Calculate agreement duration if not provided
      if (!agreementData.agreement_duration && agreementData.start_date && agreementData.end_date) {
        const startDate = new Date(agreementData.start_date);
        const endDate = new Date(agreementData.end_date);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        agreementData.agreement_duration = `${diffDays} days`;
      }

      // Always generate a new agreement number for new agreements
      let agreementNumber: string;
      try {
        agreementNumber = await this.generateAgreementNumber();
        console.log('Using generated agreement number:', agreementNumber);
      } catch (error) {
        console.error('Failed to generate agreement number:', error);
        throw this.createServiceError(
          'Failed to generate unique agreement number',
          'createAgreement'
        );
      }

      const insertData = {
        vehicle_id: agreementData.vehicle_id,
        customer_id: agreementData.customer_id,
        agreement_number: agreementNumber, // Always use the generated number
        start_date: agreementData.start_date,
        end_date: agreementData.end_date,
        status: ensureValidLeaseStatus(agreementData.status),
        deposit_amount: agreementData.deposit_amount,
        total_amount: agreementData.total_amount,
        rent_amount: agreementData.rent_amount,
        daily_late_fee: agreementData.daily_late_fee,
        agreement_type: agreementData.agreement_type || 'short_term',
        agreement_duration: agreementData.agreement_duration,
        rent_due_day: agreementData.rent_due_day ?? agreementData.payment_day,
        notes: agreementData.notes
      };

      console.log('Creating agreement with data:', insertData);

      const { data, error } = await supabase
        .from('leases')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating agreement:', error);
        
        // Handle unique constraint violation specifically
        if (error.code === '23505' && error.message.includes('agreement_number')) {
          throw this.createServiceError(
            'Agreement number already exists. Please try again.',
            'createAgreement'
          );
        }
        
        throw this.createServiceError(
          'Failed to create agreement',
          'createAgreement'
        );
      }

      console.log('Agreement created successfully:', data);
      
      // إنشاء جدولة المدفوعات التلقائية للاتفاقية الجديدة
      if (data && data.id && agreementData.rent_amount && agreementData.rent_amount > 0) {
        console.log('Creating automatic payment schedule for new agreement:', data.id);
        
        try {
          // استيراد خدمة المدفوعات بشكل ديناميكي لتجنب المراجع الدائرية
          const { agreementPaymentService } = await import('./AgreementPaymentService');
          
          const paymentScheduleResult = await agreementPaymentService.createPaymentScheduleForAgreement({
            ...data,
            start_date: data.start_date,
            end_date: data.end_date,
            rent_amount: data.rent_amount,
            payment_frequency: agreementData.payment_frequency || 'monthly',
            payment_day: agreementData.payment_day || data.rent_due_day || 1,
            deposit_amount: data.deposit_amount || 0
          });

          if (paymentScheduleResult.success) {
            console.log(`تم إنشاء ${paymentScheduleResult.scheduleCount} جدولة دفعات و ${paymentScheduleResult.paymentCount} دفعة للاتفاقية ${data.id}`);
          } else {
            console.warn('فشل في إنشاء جدولة المدفوعات التلقائية:', paymentScheduleResult.error);
            // لا نرمي خطأ هنا لأن الاتفاقية تم إنشاؤها بنجاح
            // يمكن إنشاء الجدولة لاحقاً
          }
        } catch (paymentError) {
          console.warn('خطأ في إنشاء جدولة المدفوعات التلقائية:', paymentError);
          // لا نرمي خطأ هنا لأن الاتفاقية تم إنشاؤها بنجاح
        }
      }
      
      return data;
    }, 'Failed to create agreement');
  }

  async updateAgreement(id: string, agreementData: Partial<Agreement>): Promise<Result<Agreement>> {
    return this.safeExecute(async () => {
      // For updates, only generate new agreement number if one is not provided AND the existing one is empty
      let agreementNumber = agreementData.agreement_number;
      
      if (!agreementNumber) {
        // Get the existing agreement to check if it has an agreement number
        const existing = await this.getAgreementById(id);
        if (existing.success && !existing.data.agreement_number) {
          // Only generate new number if the existing agreement doesn't have one
          agreementNumber = await this.generateAgreementNumber();
        }
      }

      // إنشاء object للتحديث يحتوي فقط على الحقول الموجودة في جدول leases
      const updateData: any = {};
      
      // إضافة الحقول الموجودة فقط إذا كانت محددة
      if (agreementData.vehicle_id !== undefined) updateData.vehicle_id = agreementData.vehicle_id;
      if (agreementData.customer_id !== undefined) updateData.customer_id = agreementData.customer_id;
      if (agreementNumber !== undefined) updateData.agreement_number = agreementNumber;
      if (agreementData.start_date !== undefined) updateData.start_date = agreementData.start_date;
      if (agreementData.end_date !== undefined) updateData.end_date = agreementData.end_date;
      if (agreementData.status !== undefined) updateData.status = ensureValidLeaseStatus(agreementData.status);
      if (agreementData.deposit_amount !== undefined) updateData.deposit_amount = agreementData.deposit_amount;
      if (agreementData.total_amount !== undefined) updateData.total_amount = agreementData.total_amount;
      if (agreementData.rent_amount !== undefined) updateData.rent_amount = agreementData.rent_amount;
      if (agreementData.daily_late_fee !== undefined) updateData.daily_late_fee = agreementData.daily_late_fee;
      if (agreementData.agreement_type !== undefined) updateData.agreement_type = agreementData.agreement_type;
      if (agreementData.agreement_duration !== undefined) updateData.agreement_duration = agreementData.agreement_duration;
      if (agreementData.payment_day !== undefined || agreementData.rent_due_day !== undefined) {
        updateData.rent_due_day = agreementData.rent_due_day ?? agreementData.payment_day;
      }
      if (agreementData.notes !== undefined) updateData.notes = agreementData.notes;
      if (agreementData.payment_frequency !== undefined) updateData.payment_frequency = agreementData.payment_frequency;
      
      // إضافة updated_at دائماً
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', asLeaseId(id))
        .select()
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to update agreement',
          'updateAgreement'
        );
      }

      if (!data) {
        throw createNotFoundError('Agreement not found', { id });
      }

      return data;
    }, 'Failed to update agreement');
  }

  async deleteAgreement(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const result = await agreementDeletionService.deleteAgreement(id);
      
      if (!result.success) {
        throw this.createServiceError(
          result.error?.toString() || 'Failed to delete agreement',
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

  async getAgreementsByStatus(status: AgreementStatus): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`*, customers:profiles(*), vehicles(*)`)
        .eq('status', status);

      if (error) {
        throw this.createServiceError(
          'Failed to fetch agreements by status',
          'getAgreementsByStatus'
        );
      }

      return data as Agreement[];
    }, 'Failed to fetch agreements by status');
  }

  async getAgreementsByDateRange(startDate: string, endDate: string): Promise<Result<Agreement[]>> {
    return this.fetchAgreements({ 
      startDate: new Date(startDate), 
      endDate: new Date(endDate) 
    });
  }
}

export const agreementService = new AgreementService();
