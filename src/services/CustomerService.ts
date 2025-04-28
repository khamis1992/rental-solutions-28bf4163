
import { profileRepository } from '@/lib/database';
import { BaseService, handleServiceOperation, ServiceResult } from './base/BaseService';
import { TableRow } from '@/lib/database/types';
import { asProfileStatus } from '@/lib/database/utils';
import { supabase } from '@/lib/supabase';

// Define customer type for readability
export type Customer = TableRow<'profiles'>;

// Define types for customer filters
export interface CustomerFilters {
  status?: string;
  searchTerm?: string;
  [key: string]: any;
}

/**
 * Customer service responsible for all operations related to customers
 */
export class CustomerService extends BaseService<'profiles'> {
  constructor() {
    super(profileRepository);
  }

  /**
   * Find customers with optional filtering
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
   * Get customer details with rental history
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
   * Update customer status
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
   * Check for document expiration
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
   * Get payment history for a customer
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

// Create singleton instance
export const customerService = new CustomerService();
