import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asTableId } from '@/lib/uuid-helpers';
import { hasData } from '@/utils/supabase-type-helpers';

export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate?: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  vehicleId?: string;
  vehicleModel?: string;
  customerId?: string;
  customerName?: string;
  paymentDate?: Date;
  leaseId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

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
  paymentStatus?: TrafficFineStatusType;
}

export const useTrafficFines = () => {
  const queryClient = useQueryClient();
  
  // Fetch all traffic fines
  const { data: trafficFines, isLoading, error } = useQuery({
    queryKey: ['trafficFines'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            vehicle_id,
            lease_id,
            payment_date,
            assignment_status
          `)
          .order('violation_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching traffic fines:', error);
          throw new Error(`Failed to fetch traffic fines: ${error.message}`);
        }

        if (!data) {
          return [];
        }
        
        // Get customer information for assigned fines
        const finesWithLeaseIds = data.filter(fine => fine.lease_id !== null && fine.lease_id !== undefined);
        let customerAndLeaseInfo: Record<string, { 
          customer_id: string; 
          customer_name?: string;
          start_date?: string;
          end_date?: string;
        }> = {};
        
        if (finesWithLeaseIds.length > 0) {
          const leaseIds = finesWithLeaseIds
            .map(fine => fine.lease_id)
            .filter(Boolean);
            
          if (leaseIds.length > 0) {
            // Create a properly typed array for the IN clause
            const validLeaseIds = leaseIds as string[];
            
            const { data: leases, error: leaseError } = await supabase
              .from('leases')
              .select('id, customer_id, start_date, end_date, profiles(full_name)')
              .in('id', validLeaseIds);
              
            if (leaseError) {
              console.error('Error fetching lease information:', leaseError);
            } else if (leases) {
              // Create a mapping of lease_id to customer information and lease dates
              leases.forEach(lease => {
                if (lease && lease.id) {
                  customerAndLeaseInfo[lease.id] = {
                    customer_id: lease.customer_id,
                    customer_name: lease.profiles?.full_name,
                    start_date: lease.start_date,
                    end_date: lease.end_date
                  };
                }
              });
            }
          }
        }
        
        // Transform the data to match our TrafficFine interface with proper null checks
        return data.map(fine => {
          const leaseId = fine.lease_id;
          const customerInfo = leaseId && customerAndLeaseInfo[leaseId] ? customerAndLeaseInfo[leaseId] : null;
          
          return {
            id: fine.id,
            violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
            licensePlate: fine.license_plate,
            violationDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
            fineAmount: fine.fine_amount || 0,
            violationCharge: fine.violation_charge,
            paymentStatus: (fine.payment_status as TrafficFineStatusType) || 'pending',
            location: fine.fine_location,
            vehicleId: fine.vehicle_id,
            paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
            leaseId: fine.lease_id,
            // Add customer information if available with null checks
            customerId: customerInfo ? customerInfo.customer_id : undefined,
            customerName: customerInfo ? customerInfo.customer_name : undefined,
            // Add lease dates for validation with null checks
            leaseStartDate: customerInfo && customerInfo.start_date ? 
              new Date(customerInfo.start_date) : undefined,
            leaseEndDate: customerInfo && customerInfo.end_date ?
              new Date(customerInfo.end_date) : undefined
          };
        });
      } catch (error) {
        console.error('Error in traffic fines data fetching:', error);
        throw error;
      }
    }
  });
  
  // Create a new traffic fine
  const createTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      try {
        // Ensure licensePlate is present and not empty
        if (!fineData.licensePlate || fineData.licensePlate.trim() === '') {
          throw new Error('License plate is required for traffic fines');
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
  
  // Function to clean up invalid assignments
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async () => {
      try {
        if (!trafficFines || trafficFines.length === 0) {
          throw new Error('No traffic fines data available');
        }
        
        // Get all fines with invalid date ranges
        const invalidFines = trafficFines.filter(fine => 
          fine.leaseId && fine.violationDate && fine.leaseStartDate && 
          (fine.violationDate < fine.leaseStartDate || 
           (fine.leaseEndDate && fine.violationDate > fine.leaseEndDate))
        );
        
        if (invalidFines.length === 0) {
          toast.info('No invalid fine assignments found');
          return { cleaned: 0 };
        }
        
        const invalidFineIds = invalidFines.map(fine => fine.id);
        
        // Clear the lease_id for these fines
        const { error, count } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: null,
            assignment_status: 'pending'
          })
          .in('id', invalidFineIds);
        
        if (error) {
          throw new Error(`Failed to clean up invalid assignments: ${error.message}`);
        }
        
        return { cleaned: invalidFineIds.length };
      } catch (error) {
        console.error('Error cleaning up invalid assignments:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success(`Successfully cleaned up ${data.cleaned} invalid fine assignments`);
    },
    onError: (error: Error) => {
      toast.error('Failed to clean up invalid assignments', {
        description: error.message
      });
    }
  });
  
  return {
    trafficFines,
    isLoading,
    error,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine,
    createTrafficFine,
    cleanupInvalidAssignments
  };
};
