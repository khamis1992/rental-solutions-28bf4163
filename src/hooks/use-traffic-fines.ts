
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asTableId } from '@/lib/uuid-helpers';
import { hasData } from '@/utils/supabase-type-helpers';
import { 
  TrafficFine, 
  TrafficFinePayload, 
  TrafficFineCreatePayload, 
  TrafficFineStatusType,
  TrafficFineRow
} from '@/types/traffic-fine-types';
import { logOperation } from '@/utils/monitoring-utils';

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
          logOperation('trafficFines.fetch', 'error', { error }, error.message);
          throw new Error(`Failed to fetch traffic fines: ${error.message}`);
        }

        if (!data) {
          return [];
        }
        
        // Get customer information for assigned fines
        const finesWithLeaseIds = data.filter(fine => fine.lease_id);
        let customerAndLeaseInfo: Record<string, { 
          customer_id: string; 
          customer_name?: string;
          start_date?: string;
          end_date?: string;
        }> = {};
        
        if (finesWithLeaseIds.length > 0) {
          const leaseIds = finesWithLeaseIds.map(fine => fine.lease_id).filter(Boolean);
          const { data: leases, error: leaseError } = await supabase
            .from('leases')
            .select('id, customer_id, start_date, end_date, profiles(full_name)')
            .in('id', leaseIds as string[]);
            
          if (leaseError) {
            logOperation('trafficFines.fetchLeases', 'warning', { error: leaseError }, leaseError.message);
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
        
        // Transform the data to match our TrafficFine interface
        return data.map(fine => ({
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
          // Add customer information if available
          customerId: fine.lease_id ? customerAndLeaseInfo[fine.lease_id]?.customer_id : undefined,
          customerName: fine.lease_id ? customerAndLeaseInfo[fine.lease_id]?.customer_name : undefined,
          // Add lease dates for validation
          leaseStartDate: fine.lease_id && customerAndLeaseInfo[fine.lease_id]?.start_date ? 
            new Date(customerAndLeaseInfo[fine.lease_id].start_date as string) : undefined,
          leaseEndDate: fine.lease_id && customerAndLeaseInfo[fine.lease_id]?.end_date ?
            new Date(customerAndLeaseInfo[fine.lease_id].end_date as string) : undefined
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.fetch', 'error', { error }, errorMessage);
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
          const errorMessage = `Failed to create traffic fine: ${error.message}`;
          logOperation('trafficFines.create', 'error', { payload: dbPayload }, errorMessage);
          throw new Error(errorMessage);
        }
        
        logOperation('trafficFines.create', 'success', { id: data.id }, 'Traffic fine created successfully');
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.create', 'error', { error: errorMessage }, errorMessage);
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
        // First get the traffic fine details to find license plate and violation date
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate, violation_date')
          .eq('id', id)
          .single();
          
        if (fineError || !fine) {
          const errorMessage = `Failed to fetch fine details: ${fineError?.message || 'No data found'}`;
          logOperation('trafficFines.assignToCustomer', 'error', { id }, errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!fine.license_plate) {
          const errorMessage = 'Cannot assign fine: No license plate information available';
          logOperation('trafficFines.assignToCustomer', 'error', { id }, errorMessage);
          throw new Error(errorMessage);
        }

        const violationDate = new Date(fine.violation_date);
        
        // Find the vehicle with this license plate
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', fine.license_plate)
          .single();
          
        if (vehicleError || !vehicleData) {
          const errorMessage = `No vehicle found with license plate ${fine.license_plate}`;
          logOperation('trafficFines.assignToCustomer', 'error', { licensePlate: fine.license_plate }, errorMessage);
          throw new Error(errorMessage);
        }
        
        // Find active lease for this vehicle that covers the violation date
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id, start_date, end_date')
          .eq('vehicle_id', vehicleData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
          
        if (leaseError) {
          const errorMessage = `Error finding leases: ${leaseError.message}`;
          logOperation('trafficFines.assignToCustomer', 'error', { vehicleId: vehicleData.id }, errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!leaseData || leaseData.length === 0) {
          const errorMessage = `No active lease found for this vehicle`;
          logOperation('trafficFines.assignToCustomer', 'warning', { vehicleId: vehicleData.id }, errorMessage);
          throw new Error(errorMessage);
        }

        // Find a lease where violation date falls between start and end date
        let matchingLease = null;
        for (const lease of leaseData) {
          const startDate = new Date(lease.start_date);
          const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
          
          if (violationDate >= startDate && violationDate <= endDate) {
            matchingLease = lease;
            break;
          }
        }
        
        if (!matchingLease) {
          const errorMessage = `Traffic fine date (${violationDate.toLocaleDateString()}) is outside any lease period for this vehicle`;
          logOperation('trafficFines.assignToCustomer', 'warning', { 
            violationDate: violationDate.toISOString(),
            vehicleId: vehicleData.id 
          }, errorMessage);
          throw new Error(errorMessage);
        }
        
        // Update the fine with the lease ID
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: matchingLease.id,
            assignment_status: 'assigned'
          })
          .eq('id', id);
          
        if (updateError) {
          const errorMessage = `Failed to assign fine: ${updateError.message}`;
          logOperation('trafficFines.assignToCustomer', 'error', { id, leaseId: matchingLease.id }, errorMessage);
          throw new Error(errorMessage);
        }
        
        return { 
          success: true, 
          message: 'Fine assigned to customer successfully',
          leaseId: matchingLease.id,
          customerId: matchingLease.customer_id
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.assignToCustomer', 'error', { id }, errorMessage);
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
      try {
        const { error } = await supabase
          .from('traffic_fines')
          .update({ 
            payment_status: 'paid',
            payment_date: new Date().toISOString()
          })
          .eq('id', id);
          
        if (error) {
          const errorMessage = `Failed to pay fine: ${error.message}`;
          logOperation('trafficFines.pay', 'error', { id }, errorMessage);
          throw new Error(errorMessage);
        }
        
        logOperation('trafficFines.pay', 'success', { id }, 'Traffic fine payment recorded');
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.pay', 'error', { id }, errorMessage);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    }
  });
  
  // Dispute a traffic fine
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: TrafficFinePayload) => {
      try {
        const { error } = await supabase
          .from('traffic_fines')
          .update({ payment_status: 'disputed' })
          .eq('id', id);
          
        if (error) {
          const errorMessage = `Failed to dispute fine: ${error.message}`;
          logOperation('trafficFines.dispute', 'error', { id }, errorMessage);
          throw new Error(errorMessage);
        }
        
        logOperation('trafficFines.dispute', 'success', { id }, 'Traffic fine marked as disputed');
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.dispute', 'error', { id }, errorMessage);
        throw error;
      }
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
          const errorMessage = 'No traffic fines data available';
          logOperation('trafficFines.cleanupInvalidAssignments', 'warning', {}, errorMessage);
          throw new Error(errorMessage);
        }
        
        // Get all fines with invalid date ranges
        const invalidFines = trafficFines.filter(fine => 
          fine.leaseId && fine.violationDate && fine.leaseStartDate && 
          (fine.violationDate < fine.leaseStartDate || 
           (fine.leaseEndDate && fine.violationDate > fine.leaseEndDate))
        );
        
        if (invalidFines.length === 0) {
          logOperation('trafficFines.cleanupInvalidAssignments', 'success', {}, 'No invalid fine assignments found');
          toast.info('No invalid fine assignments found');
          return { cleaned: 0 };
        }
        
        const invalidFineIds = invalidFines.map(fine => fine.id);
        logOperation('trafficFines.cleanupInvalidAssignments', 'success', { count: invalidFineIds.length }, 
          `Found ${invalidFineIds.length} invalid fine assignments to clean up`);
        
        // Clear the lease_id for these fines
        const { error, count } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: null,
            assignment_status: 'pending'
          })
          .in('id', invalidFineIds);
        
        if (error) {
          const errorMessage = `Failed to clean up invalid assignments: ${error.message}`;
          logOperation('trafficFines.cleanupInvalidAssignments', 'error', { ids: invalidFineIds }, errorMessage);
          throw new Error(errorMessage);
        }
        
        logOperation('trafficFines.cleanupInvalidAssignments', 'success', { count: invalidFineIds.length }, 
          `Successfully cleaned up ${invalidFineIds.length} invalid fine assignments`);
        return { cleaned: invalidFineIds.length };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logOperation('trafficFines.cleanupInvalidAssignments', 'error', { error: errorMessage }, errorMessage);
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
