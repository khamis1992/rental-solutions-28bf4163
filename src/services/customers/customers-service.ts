
import { supabase } from '@/integrations/supabase/client';
import { createTableQuery, executeQuery, asDbId } from '@/services/core/database-utils';
import { ProfileRow } from '@/services/core/database-types';
import { toast } from 'sonner';

// Re-export the query builder for convenience
export const customerQuery = createTableQuery('profiles');

export interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  driver_license: string | null;
  nationality: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilterOptions {
  status?: string;
  search?: string;
  nationality?: string;
  role?: string;
}

/**
 * Service for customer-related operations
 */
export class CustomerService {
  /**
   * Fetch customers with optional filtering
   */
  static async fetchCustomers(options: CustomerFilterOptions = {}): Promise<Customer[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*');
      
      // Only fetch customers by default
      query = query.eq('role', 'customer');

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      if (options.nationality && options.nationality !== 'all') {
        query = query.eq('nationality', options.nationality);
      }

      if (options.search) {
        const searchTerm = options.search.trim().toLowerCase();
        query = query.or(
          `full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,driver_license.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to fetch customers');
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }

      return (data || []) as Customer[];
    } catch (error: any) {
      console.error('Unexpected error in fetchCustomers:', error);
      toast.error(`Error fetching customers: ${error.message || 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Fetch a single customer by ID
   */
  static async getCustomer(id: string): Promise<Customer | null> {
    return executeQuery<Customer>(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single(),
      `Failed to fetch customer with ID ${id}`
    );
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: Partial<ProfileRow>): Promise<Customer | null> {
    // Ensure role is set to customer
    data.role = 'customer';
    
    return executeQuery<Customer>(
      () => supabase
        .from('profiles')
        .insert(data)
        .select()
        .single(),
      'Failed to create customer'
    );
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, data: Partial<ProfileRow>): Promise<Customer | null> {
    return executeQuery<Customer>(
      () => supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single(),
      `Failed to update customer ${id}`
    );
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    try {
      // Check if customer has active agreements first
      const { data: activeAgreements, error: checkError } = await supabase
        .from('leases')
        .select('id')
        .eq('customer_id', id)
        .eq('status', 'active')
        .limit(1);

      if (checkError) {
        console.error('Error checking for active agreements:', checkError);
        toast.error('Failed to check for active agreements');
        return false;
      }

      if (activeAgreements && activeAgreements.length > 0) {
        toast.error('Cannot delete customer with active agreements');
        return false;
      }

      // If no active agreements, proceed with deletion
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        toast.error(`Failed to delete customer: ${error.message}`);
        return false;
      }

      toast.success('Customer deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error in deleteCustomer:', error);
      toast.error(`Failed to delete customer: ${error.message || 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Search customers by name, email, phone, or license
   */
  static async searchCustomers(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,driver_license.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    return data as Customer[];
  }

  /**
   * Get customer agreements
   */
  static async getCustomerAgreements(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        vehicles:vehicle_id (id, make, model, license_plate)
      `)
      .eq('customer_id', customerId);

    if (error) {
      console.error('Error fetching customer agreements:', error);
      return [];
    }

    return data || [];
  }
}
