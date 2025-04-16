import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { hasData, safeMapArray } from '@/utils/database-type-helpers';

// Define and export the TrafficFine interface
export interface TrafficFine {
  id: string;
  violation_number: string;
  violation_date: string;
  fine_amount: number;
  violation_points?: number;
  violation_charge?: string;
  fine_location?: string;
  license_plate?: string;
  payment_status?: string;
  payment_date?: string;
  validation_status?: string;
  validation_date?: string;
  validation_result?: any;
  vehicle_id?: string;
  lease_id?: string;
  assignment_status?: string;
  // Camel case properties for component compatibility
  violationNumber?: string;
  violationDate?: string;
  fineAmount?: number;
  violationCharge?: string;
  location?: string;
  licensePlate?: string;
  paymentStatus?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  leaseId?: string;
}

// Define and export TrafficFineCreatePayload
export interface TrafficFineCreatePayload {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
  paymentStatus?: string;
}

export const useTrafficFines = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all traffic fines
  const { data: trafficFines = [], isLoading, error, refetch } = useQuery({
    queryKey: ['traffic-fines'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .order('violation_date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Transform snake_case to camelCase for component compatibility
        // using safe mapping to handle null values
        return safeMapArray(data, fine => {
          return {
            // Keep snake_case properties
            id: fine.id || '',
            violation_number: fine.violation_number || '',
            violation_date: fine.violation_date || '',
            fine_amount: fine.fine_amount || 0,
            violation_charge: fine.violation_charge || '',
            fine_location: fine.fine_location || '',
            license_plate: fine.license_plate || '',
            payment_status: fine.payment_status || 'pending',
            lease_id: fine.lease_id || '',
            
            // Add camelCase aliases for components
            violationNumber: fine.violation_number || '',
            violationDate: fine.violation_date || '',
            fineAmount: fine.fine_amount || 0,
            violationCharge: fine.violation_charge || '',
            location: fine.fine_location || '',
            licensePlate: fine.license_plate || '',
            paymentStatus: fine.payment_status || 'pending',
            leaseId: fine.lease_id || ''
          } as TrafficFine;
        });
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        throw error;
      }
    }
  });
  
  // Get fines with full details
  const getTrafficFinesWithDetails = async () => {
    try {
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .order('validation_status', { ascending: true })
        .order('violation_date', { ascending: false });
      
      if (error || !fines) {
        console.error('Error fetching traffic fines:', error);
        return [];
      }
      
      // Get lease information for all fines that have a lease_id
      const leaseIds = fines
        .filter(fine => fine && fine.lease_id)
        .map(fine => fine.lease_id)
        .filter(Boolean);
      
      if (leaseIds.length > 0) {
        // Use in to filter by multiple IDs
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select(`
            id,
            customer_id,
            profiles:customer_id (
              full_name,
              email,
              phone_number,
              nationality
            )
          `)
          .in('id', leaseIds as any);
        
        if (leasesError || !leases) {
          console.error('Error fetching leases for traffic fines:', leasesError);
        } else {
          // Create a lookup map for lease information
          const leaseMap: Record<string, any> = {};
          
          leases.forEach(lease => {
            if (lease && lease.id) {
              const profiles = lease.profiles;
              leaseMap[lease.id] = {
                id: lease.id,
                customerId: lease.customer_id,
                customerName: profiles && typeof profiles === 'object' && 'full_name' in profiles 
                  ? (profiles as any).full_name 
                  : 'Unknown',
                customerPhone: profiles && typeof profiles === 'object' && 'phone_number' in profiles 
                  ? (profiles as any).phone_number 
                  : 'Unknown'
              };
            }
          });
          
          // Enrich traffic fines with lease information
          return safeMapArray(fines, fine => {
            if (!fine || !fine.id) return null;
            
            const fineData = {
              // Include all original fields
              ...fine,
              
              // Add camelCase aliases for components
              violationNumber: fine.violation_number || '',
              licensePlate: fine.license_plate || '',
              violationDate: fine.violation_date || '',
              fineAmount: fine.fine_amount || 0,
              violationCharge: fine.violation_charge || '',
              location: fine.fine_location || '',
              paymentStatus: fine.payment_status || 'pending',
              leaseId: fine.lease_id || '',
              vehicleId: fine.vehicle_id || '',
            } as TrafficFine;
            
            // Add lease information if available
            if (fine.lease_id && leaseMap[fine.lease_id]) {
              return {
                ...fineData,
                customerName: leaseMap[fine.lease_id].customerName,
                customerPhone: leaseMap[fine.lease_id].customerPhone,
                customerId: leaseMap[fine.lease_id].customerId
              };
            }
            
            return fineData;
          });
        }
      }
      
      // Return basic fine information if no leases are associated
      return safeMapArray(fines, fine => {
        if (!fine) return null;
        
        return {
          // Include all original fields
          ...fine,
          // Add camelCase aliases
          violationNumber: fine.violation_number || '',
          licensePlate: fine.license_plate || '',
          violationDate: fine.violation_date || '',
          fineAmount: fine.fine_amount || 0,
          violationCharge: fine.violation_charge || '',
          location: fine.fine_location || '',
          paymentStatus: fine.payment_status || 'pending',
          leaseId: fine.lease_id || '',
          vehicleId: fine.vehicle_id || ''
        } as TrafficFine;
      });
    } catch (error) {
      console.error('Error in getTrafficFinesWithDetails:', error);
      return [];
    }
  };
  
  // Validate license plate
  const validateLicensePlate = async (licensePlate: string) => {
    try {
      // Check if license plate exists in vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('license_plate', licensePlate)
        .limit(1);
      
      if (vehiclesError) throw vehiclesError;
      
      if (vehicles && vehicles.length > 0) {
        return {
          isValid: true,
          message: `License plate ${licensePlate} is valid and matches a vehicle in the system.`,
          vehicle: vehicles[0]
        };
      }
      
      return {
        isValid: false,
        message: `License plate ${licensePlate} does not match any vehicle in the system.`
      };
    } catch (error) {
      console.error('Error validating license plate:', error);
      return {
        isValid: false,
        message: 'An error occurred during validation'
      };
    }
  };
  
  // Add a new traffic fine
  const addTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert({
          violation_number: fineData.violationNumber,
          license_plate: fineData.licensePlate,
          violation_date: fineData.violationDate.toISOString(),
          fine_amount: fineData.fineAmount,
          violation_charge: fineData.violationCharge,
          fine_location: fineData.location,
          payment_status: fineData.paymentStatus || 'pending',
          validation_status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Traffic Fine Added',
        description: 'The fine has been successfully added.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add traffic fine: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Update an existing traffic fine
  const updateTrafficFine = useMutation({
    mutationFn: async (fineData: Partial<TrafficFine> & { id: string }) => {
      const { id, ...updateData } = fineData;
      
      // Convert camelCase to snake_case for database
      const dbData = {
        violation_number: updateData.violation_number || updateData.violationNumber,
        license_plate: updateData.license_plate || updateData.licensePlate,
        violation_date: updateData.violation_date || updateData.violationDate,
        fine_amount: updateData.fine_amount || updateData.fineAmount,
        violation_charge: updateData.violation_charge || updateData.violationCharge,
        fine_location: updateData.fine_location || updateData.location,
        payment_status: updateData.payment_status || updateData.paymentStatus
      };
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Traffic Fine Updated',
        description: 'The fine has been successfully updated.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update traffic fine: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Pay a traffic fine
  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Fine Paid',
        description: 'Traffic fine has been marked as paid.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update payment status: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Dispute a traffic fine
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'disputed' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Fine Disputed',
        description: 'Traffic fine has been marked as disputed.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update dispute status: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Assign fine to a customer
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // First get the fine details
      const { data: fine, error: fineError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fineError || !fine) {
        throw new Error(fineError?.message || 'Fine not found');
      }
      
      if (!fine.license_plate) {
        throw new Error('Cannot assign fine without a license plate');
      }
      
      // Find vehicle by license plate
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fine.license_plate)
        .single();
      
      if (vehicleError || !vehicle) {
        throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
      }
      
      // Find active lease for this vehicle
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, customer_id')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'active' as any)
        .single();
      
      if (leaseError || !lease) {
        throw new Error(`No active lease found for vehicle with license plate ${fine.license_plate}`);
      }
      
      // Update fine with vehicle and lease information
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ 
          vehicle_id: vehicle.id, 
          lease_id: lease.id,
          assignment_status: 'assigned'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast({
        title: 'Fine Assigned',
        description: 'Traffic fine has been assigned to the customer.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to assign fine: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Create a traffic fine - alias for addTrafficFine for backward compatibility
  const createTrafficFine = addTrafficFine;
  
  return {
    trafficFines,
    isLoading,
    error,
    getTrafficFinesWithDetails,
    addTrafficFine,
    createTrafficFine,
    updateTrafficFine,
    validateLicensePlate,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    refetch
  };
};
