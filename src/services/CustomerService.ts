import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Customer, CustomerFilterParams, CustomerStatus } from '@/types/customer.types';
import { 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';
import { Result, createSuccessResult, createErrorResult } from '@/types/response.types';

interface FindCustomersParams {
  search?: string;
  status?: CustomerStatus;
  limit?: number;
  offset?: number;
}

export class CustomerService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchCustomers(filters?: CustomerFilterParams): Promise<Result<Customer[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('profiles').select('*');

      if (filters) {
        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch customers',
          { operation: 'fetchCustomers' }
        );
      }

      return data as Customer[];
    }, 'Failed to fetch customers');
  }

  async findCustomers(params: FindCustomersParams): Promise<Result<Customer[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('profiles').select('*');

      // Apply search filter
      if (params.search && params.search.trim()) {
        const searchTerm = params.search.trim();
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,driver_license.ilike.%${searchTerm}%`
        );
      }

      // Apply status filter
      if (params.status) {
        query = query.eq('status', params.status);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      // Order by name for consistent results
      query = query.order('full_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error in findCustomers:', error);
        throw createServiceError(
          `Failed to find customers: ${error.message}`,
          { operation: 'findCustomers', error }
        );
      }

      // Transform the data to ensure consistent format
      const customers = (data || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone_number || '',
        address: profile.address || '',
        driver_license: profile.driver_license || '',
        nationality: profile.nationality || '',
        notes: profile.notes || '',
        status: (profile.status || 'active') as CustomerStatus,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        // Add additional fields that might be expected
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || ''
      })) as Customer[];

      return customers;
    }, 'Failed to find customers');
  }

  async getCustomerById(id: string): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch customer',
          { operation: 'getCustomerById' }
        );
      }

      if (!data) {
        throw createNotFoundError(`Customer not found: ${id}`);
      }

      return data;
    }, 'Failed to fetch customer');
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create customer',
          { operation: 'createCustomer' }
        );
      }

      return data;
    }, 'Failed to create customer');
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update customer',
          { operation: 'updateCustomer' }
        );
      }

      if (!data) {
        throw createNotFoundError(`Customer not found: ${id}`);
      }

      return data;
    }, 'Failed to update customer');
  }

  async deleteCustomer(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete customer',
          { operation: 'deleteCustomer' }
        );
      }

      return true;
    }, 'Failed to delete customer');
  }

  async searchCustomers(searchTerm: string): Promise<Result<Customer[]>> {
    return this.findCustomers({ search: searchTerm });
  }

  async getCustomersByStatus(status: CustomerStatus): Promise<Result<Customer[]>> {
    return this.findCustomers({ status });
  }
}

export const customerService = new CustomerService();
