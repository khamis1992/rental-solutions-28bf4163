
import { supabase } from '@/lib/supabase';
import { BaseService, ServiceResponse } from './base/BaseService';
import { toast } from 'sonner';

export interface CustomerFilters {
  search?: string;
  searchTerm?: string; // Add this missing property
  status?: string;
  limit?: number;
  offset?: number;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  phone?: string; // Add this for compatibility
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  driver_license?: string;
  nationality?: string;
  notes?: string;
  status?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export class CustomerService extends BaseService {
  
  async findCustomers(filters: CustomerFilters = {}): Promise<ServiceResponse<Customer[]>> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

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
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        return this.handleError(error, 'Failed to fetch customers');
      }

      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred while fetching customers');
    }
  }

  async getCustomerDetails(id: string): Promise<ServiceResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'customer')
        .single();

      if (error) {
        return this.handleError(error, 'Failed to fetch customer details');
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred while fetching customer details');
    }
  }

  async create(customerData: Partial<Customer>): Promise<ServiceResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ ...customerData, role: 'customer' }])
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to create customer');
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred while creating customer');
    }
  }

  async update(id: string, customerData: Partial<Customer>): Promise<ServiceResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(customerData)
        .eq('id', id)
        .eq('role', 'customer')
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to update customer');
      }

      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred while updating customer');
    }
  }

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      // Check if customer has active agreements first
      const { data: activeAgreements, error: agreementError } = await supabase
        .from('leases')
        .select('id')
        .eq('customer_id', id)
        .eq('status', 'active');

      if (agreementError) {
        return this.handleError(agreementError, 'Failed to check customer agreements');
      }

      if (activeAgreements && activeAgreements.length > 0) {
        return this.handleError(
          new Error('Cannot delete customer with active agreements'),
          'Cannot delete customer with active agreements'
        );
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('role', 'customer');

      if (error) {
        return this.handleError(error, 'Failed to delete customer');
      }

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'An unexpected error occurred while deleting customer');
    }
  }
}

// Create a singleton instance
export const customerService = new CustomerService(supabase);
