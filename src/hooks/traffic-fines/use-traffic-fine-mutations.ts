
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface TrafficFinePayload {
  id: string;
}

export interface TrafficFineCreatePayload {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
  paymentStatus?: string;
}

/**
 * Hook that provides mutations for traffic fines management
 */
export function useTrafficFineMutations() {
  const queryClient = useQueryClient();
  
  // Create a new traffic fine
  const createTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      try {
        // Ensure licensePlate is present and not empty
        if (!fineData.licensePlate || fineData.licensePlate.trim() === '') {
          throw new Error('License plate is required for traffic fines');
        }
        
        // Validate violation date is not in the future
        const currentDate = new Date();
        currentDate.setHours(23, 59, 59, 999); // End of today
        
        if (fineData.violationDate > currentDate) {
          throw new Error('Violation date cannot be in the future');
        }
        
        // Create payload for database
        const dbPayload = {
          violation_number: fineData.violationNumber,
          license_plate: fineData.licensePlate.trim(),
          violation_date: fineData.violationDate,
          fine_amount: fineData.fineAmount,
          violation_charge: fineData.violationCharge,
          fine_location: fineData.location,
          payment_status: fineData.paymentStatus || 'pending',
          assignment_status: 'pending'
        };
        
        const { data, error } = await supabase
          .from('traffic_fines')
          .insert(dbPayload)
          .select('*')
          .single();
          
        if (error) {
          throw new Error(`Failed to create traffic fine: ${error.message}`);
        }
        
        return data;
      } catch (error) {
        console.error('Error creating traffic fine:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });
  
  // Assign a traffic fine to a customer
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      try {
        console.log(`Attempting to assign fine ${id} to customer`);
        
        // First get the traffic fine details to find license plate and violation date
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate, violation_date')
          .eq('id', id)
          .single();
          
        if (fineError || !fine) {
          throw new Error(`Failed to fetch fine details: ${fineError?.message || 'No data found'}`);
        }
        
        if (!fine.license_plate) {
          throw new Error('Cannot assign fine: No license plate information available');
        }

        const violationDate = new Date(fine.violation_date);
        console.log(`Fine violation date: ${violationDate.toISOString()}`);
        
        // Find the vehicle with this license plate
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', fine.license_plate)
          .single();
          
        if (vehicleError || !vehicleData) {
          throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
        }
        
        // Find active lease for this vehicle that covers the violation date
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id, start_date, end_date')
          .eq('vehicle_id', vehicleData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
          
        if (leaseError) {
          throw new Error(`Error finding leases: ${leaseError.message}`);
        }
        
        if (!leaseData || leaseData.length === 0) {
          throw new Error(`No active lease found for this vehicle`);
        }

        // Find a lease where violation date falls between start and end date
        let matchingLease = null;
        for (const lease of leaseData) {
          const startDate = new Date(lease.start_date);
          const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
          
          console.log(`Checking lease ${lease.id}: start=${startDate.toISOString()}, end=${endDate.toISOString()}`);
          
          if (violationDate >= startDate && violationDate <= endDate) {
            matchingLease = lease;
            break;
          }
        }
        
        if (!matchingLease) {
          throw new Error(`Traffic fine date (${violationDate.toLocaleDateString()}) is outside any lease period for this vehicle`);
        }
        
        console.log(`Found matching lease ${matchingLease.id} for the violation date`);
        
        // Update the fine with the lease ID
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: matchingLease.id,
            assignment_status: 'assigned'
          })
          .eq('id', id);
          
        if (updateError) {
          throw new Error(`Failed to assign fine: ${updateError.message}`);
        }
        
        return { 
          success: true, 
          message: 'Fine assigned to customer successfully',
          leaseId: matchingLease.id,
          customerId: matchingLease.customer_id
        };
      } catch (error) {
        console.error('Error assigning fine to customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Fine assigned to customer successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign fine', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Pay a traffic fine
  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ 
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        throw new Error(`Failed to pay fine: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });
  
  // Dispute a traffic fine
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'disputed' })
        .eq('id', id);
        
      if (error) {
        throw new Error(`Failed to dispute fine: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });

  return {
    createTrafficFine,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine
  };
}
