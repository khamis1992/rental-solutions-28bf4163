import { supabase } from '@/lib/supabase';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { BaseService } from '@/services/base/BaseService';
import { Result } from '@/types/response.types';
import { AgreementStatus } from '@/types/agreement.types';
import { PaymentStatus } from '@/types/payment.types';

// Pagination interfaces
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

// Enhanced filters with pagination
export interface PaginatedAgreementFilters extends PaginationParams {
  statuses?: AgreementStatus[];  
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;  
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
  // Performance optimization fields
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelations?: boolean;
}

export class PaginatedAgreementService extends BaseService {
  private readonly DEFAULT_PAGE_SIZE = 25;
  private readonly MAX_PAGE_SIZE = 100;

  constructor() {
    super(supabase);
  }

  /**
   * Fetch agreements with optimized pagination
   */
  async fetchAgreementsPaginated(filters?: PaginatedAgreementFilters): Promise<Result<PaginatedResult<Agreement>>> {
    return this.safeExecute(async () => {
      const {
        page = 1,
        pageSize = this.DEFAULT_PAGE_SIZE,
        sortBy = 'created_at',
        sortOrder = 'desc',
        includeRelations = true,
        ...restFilters
      } = filters || {};

      // Validate pagination parameters
      const validatedPageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);
      const validatedPage = Math.max(1, page);
      const offset = (validatedPage - 1) * validatedPageSize;

      // Build optimized select clause
      const selectClause = includeRelations 
        ? `
          *,
          customers:profiles(id, full_name, phone_number, email, status),
          vehicles(id, license_plate, make, model, year, color)
        `
        : `*`;

      // Get total count (optimized)
      let countQuery = supabase
        .from('leases')
        .select('id', { count: 'exact', head: true });

      countQuery = this.applyFiltersToQuery(countQuery, restFilters);

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Failed to get count: ${countError.message}`);
      }

      const totalPages = Math.ceil((totalCount || 0) / validatedPageSize);

      // Early return if no data
      if (totalCount === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: validatedPage,
          pageSize: validatedPageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Get paginated data
      let dataQuery = supabase
        .from('leases')
        .select(selectClause)
        .range(offset, offset + validatedPageSize - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      dataQuery = this.applyFiltersToQuery(dataQuery, restFilters);

      const { data, error } = await dataQuery;

      if (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      return {
        data: (data || []) as Agreement[],
        totalCount: totalCount || 0,
        totalPages,
        currentPage: validatedPage,
        pageSize: validatedPageSize,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      };
    });
  }

  /**
   * Optimized search with pagination
   */
  async searchAgreementsPaginated(
    searchTerm: string, 
    filters?: Omit<PaginatedAgreementFilters, 'searchTerm'>
  ): Promise<Result<PaginatedResult<Agreement>>> {
    return this.safeExecute(async () => {
      if (!searchTerm?.trim()) {
        return this.fetchAgreementsPaginated(filters);
      }

      const {
        page = 1,
        pageSize = this.DEFAULT_PAGE_SIZE,
        sortBy = 'created_at',
        sortOrder = 'desc',
        ...restFilters
      } = filters || {};

      const validatedPageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);
      const validatedPage = Math.max(1, page);
      const searchTermTrimmed = searchTerm.trim();

      // Use FTS (Full Text Search) if available, otherwise use parallel searches
      const searchResults = await this.performOptimizedSearch(searchTermTrimmed, {
        page: validatedPage,
        pageSize: validatedPageSize,
        sortBy,
        sortOrder,
        ...restFilters
      });

      return searchResults;
    });
  }

  /**
   * Get recent agreements (optimized for dashboard)
   */
  async getRecentAgreements(limit: number = 10): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          created_at,
          status,
          rent_amount,
          customers:profiles(id, full_name),
          vehicles(id, license_plate, make, model)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent agreements: ${error.message}`);
      }

      return (data || []) as Agreement[];
    });
  }

  /**
   * Get agreement stats (optimized for dashboard)
   */
  async getAgreementStats(): Promise<Result<{
    total: number;
    active: number;
    expired: number;
    pending: number;
  }>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('status')
        .not('status', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch agreement stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(item => item.status === 'active').length || 0,
        expired: data?.filter(item => item.status === 'expired').length || 0,
        pending: data?.filter(item => item.status === 'pending').length || 0,
      };

      return stats;
    });
  }

  /**
   * Apply filters to Supabase query (optimized)
   */
  private applyFiltersToQuery(query: any, filters: Omit<PaginatedAgreementFilters, keyof PaginationParams>) {
    // Status filter
    if (filters.statuses?.length) {
      query = query.in('status', filters.statuses);
    }
    
    // ID filters
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    
    if (filters.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId);
    }
    
    // Date filters (optimized with indexes)
    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate.toISOString());
    }

    if (filters.created_date_after) {
      query = query.gte('created_at', filters.created_date_after);
    }

    if (filters.created_date_before) {
      query = query.lte('created_at', filters.created_date_before);
    }

    // Numeric filters
    if (filters.rent_min !== undefined) {
      query = query.gte('rent_amount', filters.rent_min);
    }

    if (filters.rent_max !== undefined) {
      query = query.lte('rent_amount', filters.rent_max);
    }

    // Text filters (use with caution for performance)
    if (filters.agreement_number) {
      query = query.ilike('agreement_number', `%${filters.agreement_number}%`);
    }

    return query;
  }

  /**
   * Perform optimized search across multiple fields
   */
  private async performOptimizedSearch(
    searchTerm: string, 
    options: PaginatedAgreementFilters
  ): Promise<PaginatedResult<Agreement>> {
    const { page = 1, pageSize = this.DEFAULT_PAGE_SIZE } = options;
    
    // Try different search strategies in parallel
    const [byNumber, byVehicle, byCustomer] = await Promise.all([
      this.searchByField('agreement_number', searchTerm),
      this.searchByVehicleField(searchTerm),
      this.searchByCustomerField(searchTerm)
    ]);

    // Combine results and remove duplicates
    const allResults = [
      ...(byNumber.data || []),
      ...(byVehicle.data || []),
      ...(byCustomer.data || [])
    ];

    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    // Apply pagination to combined results
    const totalCount = uniqueResults.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedData = uniqueResults.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Search by specific field
   */
  private async searchByField(field: string, value: string): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(id, full_name, phone_number, email),
          vehicles(id, license_plate, make, model, year)
        `)
        .ilike(field, `%${value}%`)
        .limit(50); // Limit individual searches

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Search by vehicle fields
   */
  private async searchByVehicleField(searchTerm: string): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      // First find matching vehicles
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .or(`license_plate.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
        .limit(20);

      if (vehicleError || !vehicles?.length) {
        return [];
      }

      // Then find agreements for these vehicles
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(id, full_name, phone_number, email),
          vehicles(id, license_plate, make, model, year)
        `)
        .in('vehicle_id', vehicles.map(v => v.id))
        .limit(50);

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Search by customer fields
   */
  private async searchByCustomerField(searchTerm: string): Promise<Result<Agreement[]>> {
    return this.safeExecute(async () => {
      // First find matching customers
      const { data: customers, error: customerError } = await supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20);

      if (customerError || !customers?.length) {
        return [];
      }

      // Then find agreements for these customers
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(id, full_name, phone_number, email),
          vehicles(id, license_plate, make, model, year)
        `)
        .in('customer_id', customers.map(c => c.id))
        .limit(50);

      if (error) throw error;
      return data || [];
    });
  }
}

// Export singleton instance
export const paginatedAgreementService = new PaginatedAgreementService(); 