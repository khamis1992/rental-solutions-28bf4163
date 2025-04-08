
import { supabase } from '@/integrations/supabase/client';
import { LeaseStatus } from '@/types/agreement';

/**
 * Helper function to safely handle type incompatibilities when querying leases with status
 */
export const queryLeasesByStatus = async (status: LeaseStatus) => {
  // We need to ensure the status matches what's in the database
  // This acts as a type adapter between our frontend types and the database schema
  return supabase
    .from('leases')
    .select('*')
    .eq('status', status as string);
};

/**
 * Helper function to safely insert leases with proper status type
 */
export const insertLease = async (leaseData: any) => {
  return supabase
    .from('leases')
    .insert({
      ...leaseData,
      status: leaseData.status as string
    });
};

/**
 * Helper function to safely update leases with proper status type
 */
export const updateLease = async (id: string, leaseData: any) => {
  return supabase
    .from('leases')
    .update({
      ...leaseData,
      status: leaseData.status as string
    })
    .eq('id', id);
};
