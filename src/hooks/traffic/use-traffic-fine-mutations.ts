
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { TrafficFine, TrafficFineMutationResult } from './types';

export const useTrafficFineMutations = (
  setFines: React.Dispatch<React.SetStateAction<TrafficFine[]>>
) => {
  const [isPayFineLoading, setIsPayFineLoading] = useState(false);
  const [isDisputeLoading, setIsDisputeLoading] = useState(false);
  const [isAssignLoading, setIsAssignLoading] = useState(false);
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);

  // Mark fine as paid function
  const markFineAsPaid = async (fineId: string, paymentDate: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ 
          payment_status: 'paid',
          payment_date: paymentDate
        })
        .eq('id', fineId);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setFines(prevFines => 
        prevFines.map(fine => 
          fine.id === fineId 
            ? { ...fine, payment_status: 'paid', payment_date: paymentDate } 
            : fine
        )
      );
      
      return true;
    } catch (err) {
      console.error("Error marking fine as paid:", err);
      return false;
    }
  };

  // Add new fine function
  const addNewFine = async (fineData: Omit<TrafficFine, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert([fineData])
        .select();
      
      if (error) throw new Error(error.message);
      
      if (data && data.length > 0) {
        setFines(prevFines => [...prevFines, data[0] as TrafficFine]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding new traffic fine:", err);
      return false;
    }
  };

  // Pay traffic fine mutation
  const payTrafficFine = {
    mutate: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      setIsPayFineLoading(true);
      try {
        const { error } = await supabase
          .from('traffic_fines')
          .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
          .eq('id', id);
        
        if (error) throw new Error(error.message);
        
        // Update local state
        setFines(prevFines =>
          prevFines.map(fine =>
            fine.id === id
              ? { ...fine, payment_status: 'paid', payment_date: new Date().toISOString() }
              : fine
          )
        );
        return { success: true, id };
      } catch (error) {
        console.error("Error paying fine:", error);
        return { success: false };
      } finally {
        setIsPayFineLoading(false);
      }
    },
    mutateAsync: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      return payTrafficFine.mutate({ id });
    },
    isLoading: isPayFineLoading
  };

  // Dispute traffic fine mutation
  const disputeTrafficFine = {
    mutate: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      setIsDisputeLoading(true);
      try {
        const { error } = await supabase
          .from('traffic_fines')
          .update({ payment_status: 'disputed' })
          .eq('id', id);
        
        if (error) throw new Error(error.message);
        
        // Update local state
        setFines(prevFines =>
          prevFines.map(fine =>
            fine.id === id ? { ...fine, payment_status: 'disputed' } : fine
          )
        );
        return { success: true, id };
      } catch (error) {
        console.error("Error disputing fine:", error);
        return { success: false };
      } finally {
        setIsDisputeLoading(false);
      }
    },
    mutateAsync: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      return disputeTrafficFine.mutate({ id });
    },
    isLoading: isDisputeLoading
  };

  // Assign to customer mutation
  const assignToCustomer = {
    mutate: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      setIsAssignLoading(true);
      try {
        const fine = await findFineById(id);
        if (!fine?.license_plate) {
          throw new Error("Missing license plate information");
        }
        
        // Find the most recent lease with this license plate
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select(`
            id, 
            customer_id,
            vehicles(license_plate),
            profiles:customer_id(full_name)
          `)
          .eq('vehicles.license_plate', fine.license_plate)
          .order('start_date', { ascending: false })
          .limit(1);
        
        if (leaseError) throw new Error(leaseError.message);
        if (!leaseData || leaseData.length === 0) {
          throw new Error(`No lease found for license plate ${fine.license_plate}`);
        }
        
        const lease = leaseData[0];
        
        // Update the fine with customer information
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({
            lease_id: lease.id,
            customer_id: lease.customer_id,
            assignment_status: 'assigned'
          })
          .eq('id', id);
        
        if (updateError) throw new Error(updateError.message);
        
        // Update local state
        setFines(prevFines =>
          prevFines.map(f =>
            f.id === id ? { 
              ...f, 
              lease_id: lease.id,
              customer_id: lease.customer_id,
              assignment_status: 'assigned',
              customerName: lease.profiles?.full_name
            } : f
          )
        );
        
        return { success: true, id };
      } catch (error) {
        console.error("Error assigning to customer:", error);
        return { success: false };
      } finally {
        setIsAssignLoading(false);
      }
    },
    mutateAsync: async ({ id }: { id: string }): Promise<TrafficFineMutationResult> => {
      return assignToCustomer.mutate({ id });
    },
    isLoading: isAssignLoading
  };

  // Helper to find fine by ID
  const findFineById = async (id: string): Promise<TrafficFine | null> => {
    const currentFines = await getCurrentFines();
    const fine = currentFines.find(f => f.id === id);
    
    if (fine) return fine;
    
    // If not found in state, try to fetch from DB
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return null;
    return data as TrafficFine;
  };

  // Helper to get current fines (for cases where we need to access outside of component)
  const getCurrentFines = (): Promise<TrafficFine[]> => {
    return new Promise(resolve => {
      setFines(currentFines => {
        resolve(currentFines);
        return currentFines;
      });
    });
  };

  // Cleanup invalid assignments mutation
  const cleanupInvalidAssignments = {
    mutate: async (): Promise<TrafficFineMutationResult> => {
      setIsCleanupLoading(true);
      try {
        // First, gather all lease_ids from the fines
        const finesWithLeases = (await getCurrentFines()).filter(fine => fine.lease_id && fine.violation_date);
        const leaseIds = [...new Set(finesWithLeases.map(fine => fine.lease_id))];
        
        if (leaseIds.length === 0) {
          return { success: true, count: 0 };
        }
        
        // Fetch all lease data in a single batch
        const { data: leaseDataList, error: leaseError } = await supabase
          .from('leases')
          .select('id, start_date, end_date')
          .in('id', leaseIds.filter(Boolean) as string[]);
        
        if (leaseError) {
          throw new Error(`Error fetching lease data: ${leaseError.message}`);
        }
        
        // Create a map of lease data for easy lookup
        const leaseDataMap: Record<string, { start_date: string, end_date: string }> = {};
        leaseDataList?.forEach(lease => {
          if (lease.id) {
            leaseDataMap[lease.id] = { 
              start_date: lease.start_date,
              end_date: lease.end_date
            };
          }
        });
        
        // Now identify invalid assignments based on the pre-fetched lease data
        const invalidAssignedFines = finesWithLeases.filter(fine => {
          if (!fine.lease_id || !fine.violation_date) return false;
          
          const leaseData = leaseDataMap[fine.lease_id];
          if (!leaseData) return true; // Consider as invalid if we can't find lease data
          
          const violationDate = new Date(fine.violation_date);
          const leaseStartDate = new Date(leaseData.start_date);
          const leaseEndDate = new Date(leaseData.end_date);
          
          // If violation date is outside lease period, it's invalid
          return violationDate < leaseStartDate || violationDate > leaseEndDate;
        });
        
        const fineIds = invalidAssignedFines.map(fine => fine.id);
        
        if (fineIds.length === 0) {
          return { success: true, count: 0 };
        }
        
        // Reset customer and lease assignments
        const { error } = await supabase
          .from('traffic_fines')
          .update({
            lease_id: null,
            customer_id: null,
            assignment_status: 'pending'
          })
          .in('id', fineIds);
        
        if (error) throw new Error(error.message);
        
        // Update local state
        setFines(prevFines =>
          prevFines.map(fine =>
            fineIds.includes(fine.id) ? {
              ...fine,
              lease_id: null,
              customer_id: null,
              assignment_status: 'pending',
              customerName: undefined
            } : fine
          )
        );
        
        return { success: true, count: fineIds.length };
      } catch (error) {
        console.error("Error cleaning up invalid assignments:", error);
        return { success: false };
      } finally {
        setIsCleanupLoading(false);
      }
    },
    mutateAsync: async (): Promise<TrafficFineMutationResult> => {
      return cleanupInvalidAssignments.mutate();
    },
    isLoading: isCleanupLoading
  };

  return {
    markFineAsPaid,
    addNewFine,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    createTrafficFine: addNewFine // Alias for backward compatibility
  };
};
