
import { supabase } from '@/lib/supabase';
import { LeaseRow } from './types';
import { asLeaseStatus } from '@/lib/database-types';
import { PostgrestError } from '@supabase/supabase-js';

// Create a custom repository error type
class RepositoryError implements PostgrestError {
  name: string = 'PostgrestError';
  message: string;
  details: string;
  hint: string;
  code: string;
  
  constructor(message: string) {
    this.message = message;
    this.code = 'CUSTOM_ERROR';
    this.details = message;
    this.hint = '';
  }
}

// Prepare base repository operations
const baseOperations = {
  // Find by ID
  findById: async (id: string) => {
    const response = await supabase
      .from('leases')
      .select('*')
      .eq('id', id)
      .single();
      
    return {
      data: response.data,
      error: response.error
    };
  },
  
  // Update lease
  update: async (id: string, data: Partial<LeaseRow>) => {
    const response = await supabase
      .from('leases')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    return {
      data: response.data,
      error: response.error
    };
  }
};

// Extended repository with lease-specific operations
export const leaseRepository = {
  ...baseOperations,
  
  // Find agreements by customer
  async findByCustomer(customerId: string) {
    try {
      const response = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (response.error) {
        console.error(`Failed to fetch leases for customer ${customerId}:`, response.error);
      }
      
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error(`Error fetching leases for customer ${customerId}:`, error);
      const pgError = new RepositoryError(`Failed to fetch leases: ${error instanceof Error ? error.message : String(error)}`);
      return { data: [], error: pgError };
    }
  },
  
  // Find agreements by status
  async findByStatus(status: string) {
    try {
      const validatedStatus = asLeaseStatus(status);
      
      const response = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('status', validatedStatus);
      
      if (response.error) {
        console.error(`Failed to fetch leases with status ${status}:`, response.error);
      }
      
      return {
        data: response.data || [],
        error: response.error
      };
    } catch (error) {
      console.error(`Error fetching leases with status ${status}:`, error);
      const pgError = new RepositoryError(`Failed to fetch leases by status: ${error instanceof Error ? error.message : String(error)}`);
      return { data: [], error: pgError };
    }
  },
  
  // Update agreement status with validation
  async updateStatus(id: string, status: string, notes?: string) {
    try {
      const validatedStatus = asLeaseStatus(status);
      
      const response = await supabase
        .from('leases')
        .update({ 
          status: validatedStatus,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      return {
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error(`Error updating lease ${id} status to ${status}:`, error);
      const pgError = new RepositoryError(`Failed to update lease status: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  },
  
  // Find agreement with related data
  async findWithRelations(id: string) {
    try {
      const response = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('id', id)
        .single();
      
      if (response.error) {
        console.error(`Failed to fetch lease ${id} with relations:`, response.error);
      }
      
      return {
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error(`Error fetching lease ${id} with relations:`, error);
      const pgError = new RepositoryError(`Failed to fetch lease with relations: ${error instanceof Error ? error.message : String(error)}`);
      return { data: null, error: pgError };
    }
  }
};
