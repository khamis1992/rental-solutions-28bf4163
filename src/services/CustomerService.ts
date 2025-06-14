import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Customer, CustomerFilterParams, CustomerStatus } from '@/types/customer.types';
import { 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';
import { Result } from '@/types/response.types';

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

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch customers',
          { operation: 'fetchCustomers' }
        );
      }

      // Map to ensure full_name and phone_number are always present
      const mapped = (data || []).map((c: any) => ({
        ...c,
        full_name: c.full_name || c.name || '',
        phone_number: c.phone_number || c.phone || '',
      }));

      return mapped as Customer[];
    }, 'Failed to fetch customers');
  }

  async findCustomers(filters?: CustomerFilterParams): Promise<Result<Customer[]>> {
    return this.fetchCustomers(filters);
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
    return this.fetchCustomers({ search: searchTerm });
  }

  async getCustomersByStatus(status: CustomerStatus): Promise<Result<Customer[]>> {
    return this.fetchCustomers({ status });
  }
}

export const customerService = new CustomerService();
