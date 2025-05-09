
import { supabase } from '@/lib/supabase';
import { LeaseRow, isSuccessResponse } from './types';
import { createRepository } from './repository';
import { asLeaseStatus } from './validation';

// Get base repository functionality
const baseRepository = createRepository('leases');

// Extended repository with lease-specific operations
export const leaseRepository = {
  ...baseRepository,
  
  // Find agreements by customer
  async findByCustomer(customerId: string): Promise<LeaseRow[] | null> {
    const response = await supabase
      .from('leases')
      .select('*, customers:profiles(*), vehicles(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (!isSuccessResponse(response)) {
      console.error(`Failed to fetch leases for customer ${customerId}:`, response.error);
      return null;
    }
    
    return response.data;
  },
  
  // Find agreements by status
  async findByStatus(status: string): Promise<LeaseRow[] | null> {
    const validatedStatus = asLeaseStatus(status);
    
    const response = await supabase
      .from('leases')
      .select('*, customers:profiles(*), vehicles(*)')
      .eq('status', validatedStatus);
    
    if (!isSuccessResponse(response)) {
      console.error(`Failed to fetch leases with status ${status}:`, response.error);
      return null;
    }
    
    return response.data;
  },
  
  // Update agreement status with validation
  async updateStatus(id: string, status: string, notes?: string): Promise<LeaseRow | null> {
    const validatedStatus = asLeaseStatus(status);
    
    return await baseRepository.update(id, { 
      status: validatedStatus,
      notes: notes,
      updated_at: new Date().toISOString()
    });
  },
  
  // Find agreement with related data
  async findWithRelations(id: string): Promise<LeaseRow | null> {
    const response = await supabase
      .from('leases')
      .select('*, customers:profiles(*), vehicles(*)')
      .eq('id', id)
      .single();
    
    if (!isSuccessResponse(response)) {
      console.error(`Failed to fetch lease ${id} with relations:`, response.error);
      return null;
    }
    
    return response.data;
  }
};
