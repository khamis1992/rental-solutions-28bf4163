import { profileRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { asProfileStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';
import { CustomerInfo, CustomerSearchParams } from '@/types/customer';
import { handleError } from '@/utils/error-handler';

export type Customer = TableRow<'profiles'>;

export interface CustomerFilters {
  status?: string;
  searchTerm?: string;
  [key: string]: any;
}

/**
 * Service layer responsible for managing customer-related operations.
 * Handles all customer data interactions, validation, and business rules.
 */
export class CustomerService extends BaseService<'profiles'> {
  constructor() {
    super(profileRepository);
  }

  /**
   * Retrieves customers based on specified filters
   * @param filters - Optional filtering criteria for customer search
   * @returns Promise with filtered customer records
   */
  async findCustomers(filters?: CustomerFilters): Promise<ServiceResult<Customer[]>> {
    return handleServiceOperation(async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');
      
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', asProfileStatus(filters.status));
        }
        
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.trim();
          query = query.or(
            `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,driver_license.ilike.%${searchTerm}%`
          );
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }
      
      return data || [];
    });
  }
  /**
   * Get customers with filtering and pagination
   * This aligns with our standardized React Query hook
   */
  async getCustomers(
    params: CustomerSearchParams = { query: '', status: '' },
    limit = 10,
    offset = 0
  ): Promise<{ data: CustomerInfo[]; count: number } | null> {
    try {
      const { query, status } = params;

      // Start building the query
      let dbQuery = supabase.from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'customer');

      // Apply filters
      if (status && status !== 'all') {
        dbQuery = dbQuery.eq('status', status);
      }

      // Text search across multiple fields
      if (query && query.trim() !== '') {
        const searchTerm = query.trim();
        dbQuery = dbQuery.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`
        );
      }

      // Get total count and apply pagination
      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await dbQuery;

      if (error) {
        throw error;
      }

      return {
        data: data as CustomerInfo[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Customer listing' });
      return null;
    }
  }

  /**
   * Get a customer by their ID
   */
  async getCustomerById(id: string): Promise<CustomerInfo | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'customer')
        .single();

      if (error) {
        throw error;
      }

      return data as CustomerInfo;
    } catch (error) {
      handleError(error, { context: 'Customer details' });
      return null;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: Omit<CustomerInfo, 'id' | 'created_at'>): Promise<CustomerInfo | null> {
    try {
      const { data: newCustomer, error } = await supabase
        .from('profiles')
        .insert({
          ...data,
          role: 'customer',
          status: data.status || 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newCustomer as CustomerInfo;
    } catch (error) {
      handleError(error, { context: 'Create customer' });
      return null;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: Partial<CustomerInfo>): Promise<CustomerInfo | null> {
    try {
      const { data: updatedCustomer, error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('role', 'customer')
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedCustomer as CustomerInfo;
    } catch (error) {
      handleError(error, { context: 'Update customer' });
      return null;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<CustomerInfo | null> {
    try {
      const { data: deletedCustomer, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('role', 'customer')
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedCustomer as CustomerInfo;
    } catch (error) {
      handleError(error, { context: 'Delete customer' });
      return null;
    }
  }

  /**
   * Search for customers by name, email, or phone
   */
  async searchCustomers(query: string, limit = 5): Promise<CustomerInfo[] | null> {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const searchTerm = query.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as CustomerInfo[];
    } catch (error) {
      handleError(error, { context: 'Customer search' });
      return null;
    }
  }
  /**
   * Check document expiration for a customer
   */
  async checkDocumentExpiration(customerId: string): Promise<{ 
    customer: CustomerInfo; 
    documentStatus: { 
      hasWarnings: boolean; 
      warnings: Array<any>; 
    }; 
  } | null> {
    try {
      const customer = await this.getCustomerById(customerId);
      
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      const today = new Date();
      const expiryWarningDays = 30; // Warn when document expires within 30 days
      
      const warnings = [];
      
      // Check ID document expiration
      if (customer.id_document_expiry) {
        const idExpiryDate = new Date(customer.id_document_expiry);
        const idDaysToExpiry = Math.ceil((idExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (idDaysToExpiry <= 0) {
          warnings.push({
            document: 'ID Document',
            status: 'expired',
            expiryDate: customer.id_document_expiry
          });
        } else if (idDaysToExpiry <= expiryWarningDays) {
          warnings.push({
            document: 'ID Document',
            status: 'expiring_soon',
            daysToExpiry: idDaysToExpiry,
            expiryDate: customer.id_document_expiry
          });
        }
      }
      
      // Check license document expiration
      if (customer.license_document_expiry) {
        const licenseExpiryDate = new Date(customer.license_document_expiry);
        const licenseDaysToExpiry = Math.ceil((licenseExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (licenseDaysToExpiry <= 0) {
          warnings.push({
            document: 'Driver License',
            status: 'expired',
            expiryDate: customer.license_document_expiry
          });
        } else if (licenseDaysToExpiry <= expiryWarningDays) {
          warnings.push({
            document: 'Driver License',
            status: 'expiring_soon',
            daysToExpiry: licenseDaysToExpiry,
            expiryDate: customer.license_document_expiry
          });
        }
      }
      
      return {
        customer,
        documentStatus: {
          hasWarnings: warnings.length > 0,
          warnings
        }
      };
    } catch (error) {
      handleError(error, { context: 'Customer document check' });
      return null;
    }
  }
}

// Export a singleton instance
export const customerService = new CustomerService();
