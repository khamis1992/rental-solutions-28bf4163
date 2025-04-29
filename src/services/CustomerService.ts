import { profileRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { asProfileStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';

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
  async findCustomers(filters?: CustomerFilters, pagination?: { page: number; pageSize: number }): Promise<ServiceResult<{ data: Customer[]; count: number }>> {
    return handleServiceOperation(async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, status, driver_license, created_at, updated_at', { count: 'exact' })
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
      
      // Pagination
      if (pagination) {
        const { page, pageSize } = pagination;
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
      }

      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }
      
      return { data: data || [], count: count || 0 };
    });
  }

  /**
   * Batch update customers by IDs
   */
  async batchUpdate(ids: string[], updates: Partial<Customer>): Promise<ServiceResult<number>> {
    return handleServiceOperation(async () => {
      const { error, count } = await supabase
        .from('profiles')
        .update(updates)
        .in('id', ids);
      if (error) throw new Error(error.message);
      return count || 0;
    });
  }

  /**
   * Batch delete customers by IDs
   */
  async batchDelete(ids: string[]): Promise<ServiceResult<number>> {
    return handleServiceOperation(async () => {
      const { error, count } = await supabase
        .from('profiles')
        .delete()
        .in('id', ids);
      if (error) throw new Error(error.message);
      return count || 0;
    });
  }

  /**
   * Fetches detailed customer information including rental history
   * @param id - Customer ID to retrieve details for
   * @returns Promise with customer details and associated agreements
   */
  async getCustomerDetails(id: string): Promise<ServiceResult<Customer & { agreements: any[] }>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          agreements:leases(
            id, 
            agreement_number, 
            start_date, 
            end_date, 
            status, 
            total_amount,
            vehicles(make, model, license_plate, year)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch customer details: ${error.message}`);
      }
      
      return data;
    });
  }

  /**
   * Updates customer status while maintaining audit trail
   * @param id - Customer ID to update
   * @param status - New status to apply
   * @returns Promise with updated customer record
   */
  async updateStatus(id: string, status: string): Promise<ServiceResult<Customer>> {
    return handleServiceOperation(async () => {
      const dbStatus = asProfileStatus(status);
      const response = await this.repository.update(id, { 
        status: dbStatus,
        status_updated_at: new Date().toISOString()
      });
      
      if (response.error) {
        throw new Error(`Failed to update customer status: ${response.error.message}`);
      }
      
      return response.data;
    });
  }

  /**
   * Validates customer document expiration status
   * Implements business rules for document validation and notification
   * @param customerId - Customer ID to check documents for
   * @returns Promise with document validation results and warnings
   */
  async checkDocumentExpiration(customerId: string): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findById(customerId);
      if (response.error) {
        throw new Error(`Failed to fetch customer: ${response.error.message}`);
      }
      
      const customer = response.data;
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
    });
  }

  /**
   * Retrieves customer payment history across all agreements
   * @param customerId - Customer ID to fetch payment history for
   * @returns Promise with detailed payment history
   */
  async getPaymentHistory(customerId: string): Promise<ServiceResult<any[]>> {
    return handleServiceOperation(async () => {
      // First get all customer's agreements
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, agreement_number')
        .eq('customer_id', customerId);
      
      if (agreementsError) {
        throw new Error(`Failed to fetch customer agreements: ${agreementsError.message}`);
      }
      
      if (!agreements || agreements.length === 0) {
        return [];
      }
      
      // Get all payments for these agreements
      const agreementIds = agreements.map(a => a.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*, lease:lease_id(agreement_number)')
        .in('lease_id', agreementIds)
        .order('payment_date', { ascending: false });
      
      if (paymentsError) {
        throw new Error(`Failed to fetch customer payment history: ${paymentsError.message}`);
      }
      
      return payments || [];
    });
  }
}

export const customerService = new CustomerService();
