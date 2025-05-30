import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Customer, CustomerFilterParams } from '@/types/customer.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

export class CustomerService extends BaseService {
  constructor() {
    super(supabase);
  }

  async fetchCustomers(filters?: CustomerFilterParams): Promise<Result<Customer[]>> {
    return this.safeExecute(async () => {
      let query = supabase.from('customers').select('*');

      if (filters) {
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw createServiceError(
          'Failed to fetch customers',
          'CustomerService',
          'fetchCustomers'
        );
      }

      return data as Customer[];
    }, 'Failed to fetch customers');
  }

  async getCustomerById(id: string): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch customer',
          'CustomerService',
          'getCustomerById'
        );
      }

      if (!data) {
        throw createServiceError(
          'Customer not found',
          'CustomerService',
          'getCustomerById'
        );
      }

      return data;
    }, 'Failed to fetch customer');
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to create customer',
          'CustomerService',
          'createCustomer'
        );
      }

      return data;
    }, 'Failed to create customer');
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Result<Customer>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update customer',
          'CustomerService',
          'updateCustomer'
        );
      }

      if (!data) {
        throw createServiceError(
          'Customer not found',
          'CustomerService',
          'updateCustomer'
        );
      }

      return data;
    }, 'Failed to update customer');
  }

  async deleteCustomer(id: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        throw createServiceError(
          'Failed to delete customer',
          'CustomerService',
          'deleteCustomer'
        );
      }

      return true;
    }, 'Failed to delete customer');
  }

  async searchCustomers(searchTerm: string): Promise<Result<Customer[]>> {
    return this.fetchCustomers({ search: searchTerm });
  }

  async getCustomersByStatus(status: string): Promise<Result<Customer[]>> {
    return this.fetchCustomers({ status });
  }
}
