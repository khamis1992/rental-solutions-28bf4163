
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
        const finesWithLeaseIds = data.filter(fine => fine.lease_id);
        let customerInfo: Record<string, { customer_id: string; customer_name?: string }> = {};
        
        if (finesWithLeaseIds.length > 0) {
          const leaseIds = finesWithLeaseIds.map(fine => fine.lease_id).filter(Boolean);
          const { data: leases, error: leaseError } = await supabase
            .from('leases')
            .select('id, customer_id, profiles(full_name)')
            .in('id', leaseIds as string[]);
            
          if (leaseError) {
            console.error('Error fetching lease information:', leaseError);
          } else if (leases) {
            // Create a mapping of lease_id to customer information
            leases.forEach(lease => {
              if (lease && lease.id) {
                customerInfo[lease.id] = {
                  customer_id: lease.customer_id,
                  customer_name: lease.profiles?.full_name
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
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount || 0,
          violationCharge: fine.violation_charge,
          paymentStatus: (fine.payment_status as TrafficFineStatusType) || 'pending',
          location: fine.fine_location,
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
          leaseId: fine.lease_id,
          // Add customer information if available
          customerId: fine.lease_id ? customerInfo[fine.lease_id]?.customer_id : undefined,
          customerName: fine.lease_id ? customerInfo[fine.lease_id]?.customer_name : undefined
        }));
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
        // First get the traffic fine details to find license plate
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate')
          .eq('id', asTableId('traffic_fines', id))
          .single();
          
        if (fineError || !fine) {
          throw new Error(`Failed to fetch fine details: ${fineError?.message || 'No data found'}`);
        }
        
        if (!fine.license_plate) {
          throw new Error('Cannot assign fine: No license plate information available');
        }
        
        // Find the vehicle with this license plate
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', fine.license_plate)
          .single();
          
        if (vehicleError || !vehicleData) {
          throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
        }
        
        // Find active lease for this vehicle
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id')
          .eq('vehicle_id', asTableId('leases', vehicleData.id))
          .eq('status', asColumnValue('leases', 'status', 'active'))
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (leaseError || !leaseData) {
          throw new Error(`No active lease found for this vehicle`);
        }
        
        // Update the fine with the lease ID
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: asTableId('traffic_fines', leaseData.id),
            assignment_status: 'assigned'
          })
          .eq('id', asTableId('traffic_fines', id));
          
        if (updateError) {
          throw new Error(`Failed to assign fine: ${updateError.message}`);
        }
        
        return { 
          success: true, 
          message: 'Fine assigned to customer successfully',
          leaseId: leaseData.id,
          customerId: leaseData.customer_id
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
          payment_status: asColumnValue('traffic_fines', 'payment_status', 'paid'),
          payment_date: new Date().toISOString()
        })
        .eq('id', asTableId('traffic_fines', id));
        
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
        .update({ payment_status: asColumnValue('traffic_fines', 'payment_status', 'disputed') })
        .eq('id', asTableId('traffic_fines', id));
        
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
    trafficFines,
    isLoading,
    error,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine,
    createTrafficFine
  };
};

// Helper for type-safe column value assignment
function asColumnValue<T extends keyof any>(table: string, column: string, value: T): T {
  return value;
}
