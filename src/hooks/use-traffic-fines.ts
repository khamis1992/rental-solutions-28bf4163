
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { hasData, hasProperty, asDatabaseType } from '@/utils/database-type-helpers';

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
        
        if (!data) {
          return [];
        }

        // Transform snake_case to camelCase for component compatibility
        return data
          .filter(fine => fine !== null)
          .map((fine: any) => {
            if (!fine) return null;
            
            // Create a new object with type safety
            const transformedFine: TrafficFine = {
              id: fine.id || '',
              violation_number: fine.violation_number || '',
              violationNumber: fine.violation_number || '',
              violation_date: fine.violation_date || '',
              violationDate: fine.violation_date || '',
              fine_amount: fine.fine_amount || 0,
              fineAmount: fine.fine_amount || 0,
              violation_charge: fine.violation_charge || '',
              violationCharge: fine.violation_charge || '',
              fine_location: fine.fine_location || '',
              location: fine.fine_location || '',
              license_plate: fine.license_plate || '',
              licensePlate: fine.license_plate || '',
              payment_status: fine.payment_status || '',
              paymentStatus: fine.payment_status || '',
              lease_id: fine.lease_id || '',
              leaseId: fine.lease_id || ''
            };
            
            return transformedFine;
          })
          .filter(Boolean) as TrafficFine[];
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
      
      if (error) {
        throw error;
      }
      
      if (!fines) {
        return [];
      }

      // Get lease information for all fines that have a lease_id
      const finesWithLeaseIds = fines.filter(fine => fine && hasProperty(fine, 'lease_id') && fine.lease_id);
      
      const leaseIds = finesWithLeaseIds
        .map(fine => hasProperty(fine, 'lease_id') ? fine.lease_id : null)
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
          .in('id', leaseIds as any[]);
        
        if (leasesError) {
          console.error('Error fetching leases for traffic fines:', leasesError);
        } else if (leases && leases.length > 0) {
          // Create a lookup map for lease information
          const leaseMap: Record<string, any> = {};
          
          leases.forEach(lease => {
            if (lease && hasProperty(lease, 'id')) {
              // Safely access profile data
              const profileData = hasProperty(lease, 'profiles') && lease.profiles && typeof lease.profiles === 'object' 
                ? lease.profiles 
                : null;
              
              const customerId = hasProperty(lease, 'customer_id') ? lease.customer_id : '';
              const customerName = profileData && hasProperty(profileData, 'full_name') ? profileData.full_name : 'Unknown';
              const customerPhone = profileData && hasProperty(profileData, 'phone_number') ? profileData.phone_number : 'Unknown';
                
              leaseMap[lease.id] = {
                id: lease.id,
                customerId,
                customerName,
                customerPhone
              };
            }
          });
          
          // Enrich traffic fines with lease information
          return fines
            .filter(fine => fine !== null)
            .map(fine => {
              if (fine && hasProperty(fine, 'id')) {
                const fineData: TrafficFine = {
                  id: fine.id,
                  violation_number: hasProperty(fine, 'violation_number') ? fine.violation_number : '',
                  violationNumber: hasProperty(fine, 'violation_number') ? fine.violation_number : '',
                  license_plate: hasProperty(fine, 'license_plate') ? fine.license_plate : '',
                  licensePlate: hasProperty(fine, 'license_plate') ? fine.license_plate : '',
                  violation_date: hasProperty(fine, 'violation_date') ? fine.violation_date : '',
                  violationDate: hasProperty(fine, 'violation_date') ? fine.violation_date : '',
                  fine_amount: hasProperty(fine, 'fine_amount') ? fine.fine_amount : 0,
                  fineAmount: hasProperty(fine, 'fine_amount') ? fine.fine_amount : 0,
                  violation_charge: hasProperty(fine, 'violation_charge') ? fine.violation_charge : '',
                  violationCharge: hasProperty(fine, 'violation_charge') ? fine.violation_charge : '',
                  validation_status: hasProperty(fine, 'validation_status') ? fine.validation_status : '',
                  payment_status: hasProperty(fine, 'payment_status') ? fine.payment_status : '',
                  paymentStatus: hasProperty(fine, 'payment_status') ? fine.payment_status : '',
                  lease_id: hasProperty(fine, 'lease_id') ? fine.lease_id : '',
                  leaseId: hasProperty(fine, 'lease_id') ? fine.lease_id : '',
                  vehicle_id: hasProperty(fine, 'vehicle_id') ? fine.vehicle_id : '',
                  vehicleId: hasProperty(fine, 'vehicle_id') ? fine.vehicle_id : '',
                  fine_location: hasProperty(fine, 'fine_location') ? fine.fine_location : '',
                  location: hasProperty(fine, 'fine_location') ? fine.fine_location : ''
                };
                
                // Add lease information if available
                if (hasProperty(fine, 'lease_id') && fine.lease_id && leaseMap[fine.lease_id]) {
                  return {
                    ...fineData,
                    customerName: leaseMap[fine.lease_id].customerName,
                    customerPhone: leaseMap[fine.lease_id].customerPhone,
                    customerId: leaseMap[fine.lease_id].customerId
                  };
                }
                
                return fineData;
              }
              return null;
            })
            .filter(Boolean) as TrafficFine[];
        }
      }
      
      // Return basic fine information if no leases are associated
      return fines
        .filter(fine => fine !== null)
        .map(fine => {
          if (!fine) return null;
          
          const result: TrafficFine = {
            id: hasProperty(fine, 'id') ? fine.id : '',
            violation_number: hasProperty(fine, 'violation_number') ? fine.violation_number : '',
            violationNumber: hasProperty(fine, 'violation_number') ? fine.violation_number : '',
            license_plate: hasProperty(fine, 'license_plate') ? fine.license_plate : '',
            licensePlate: hasProperty(fine, 'license_plate') ? fine.license_plate : '',
            violation_date: hasProperty(fine, 'violation_date') ? fine.violation_date : '',
            violationDate: hasProperty(fine, 'violation_date') ? fine.violation_date : '',
            fine_amount: hasProperty(fine, 'fine_amount') ? fine.fine_amount : 0,
            fineAmount: hasProperty(fine, 'fine_amount') ? fine.fine_amount : 0,
            violation_charge: hasProperty(fine, 'violation_charge') ? fine.violation_charge : '',
            violationCharge: hasProperty(fine, 'violation_charge') ? fine.violation_charge : '',
            validation_status: hasProperty(fine, 'validation_status') ? fine.validation_status : '',
            payment_status: hasProperty(fine, 'payment_status') ? fine.payment_status : '',
            paymentStatus: hasProperty(fine, 'payment_status') ? fine.payment_status : '',
            lease_id: hasProperty(fine, 'lease_id') ? fine.lease_id : '',
            leaseId: hasProperty(fine, 'lease_id') ? fine.lease_id : '',
            vehicle_id: hasProperty(fine, 'vehicle_id') ? fine.vehicle_id : '',
            vehicleId: hasProperty(fine, 'vehicle_id') ? fine.vehicle_id : '',
            fine_location: hasProperty(fine, 'fine_location') ? fine.fine_location : '',
            location: hasProperty(fine, 'fine_location') ? fine.fine_location : ''
          };
          
          return result;
        })
        .filter(Boolean) as TrafficFine[];
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
        .eq('license_plate', licensePlate as any)
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
      const insertData = asDatabaseType<any>({
        violation_number: fineData.violationNumber,
        license_plate: fineData.licensePlate,
        violation_date: fineData.violationDate.toISOString(),
        fine_amount: fineData.fineAmount,
        violation_charge: fineData.violationCharge,
        fine_location: fineData.location,
        payment_status: fineData.paymentStatus || 'pending',
        validation_status: 'pending'
      });
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert(insertData)
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
      const dbData = asDatabaseType<any>({
        violation_number: updateData.violationNumber,
        license_plate: updateData.licensePlate,
        violation_date: updateData.violationDate,
        fine_amount: updateData.fineAmount,
        violation_charge: updateData.violationCharge,
        fine_location: updateData.location,
        payment_status: updateData.paymentStatus
      });
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(dbData)
        .eq('id', id as any)
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
      const updateData = asDatabaseType<any>({
        payment_status: 'paid',
        payment_date: new Date().toISOString()
      });
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
        .eq('id', id as any)
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
      const updateData = asDatabaseType<any>({
        payment_status: 'disputed'
      });
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
        .eq('id', id as any)
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
        .eq('id', id as any)
        .single();
      
      if (fineError || !fine) {
        throw new Error(fineError?.message || 'Fine not found');
      }
      
      if (!hasProperty(fine, 'license_plate') || !fine.license_plate) {
        throw new Error('Cannot assign fine without a license plate');
      }
      
      // Find vehicle by license plate
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fine.license_plate as any)
        .single();
      
      if (vehicleError || !vehicle) {
        throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
      }
      
      if (!hasProperty(vehicle, 'id')) {
        throw new Error('Invalid vehicle data returned');
      }
      
      // Find active lease for this vehicle
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, customer_id')
        .eq('vehicle_id', vehicle.id as any)
        .eq('status', 'active' as any)
        .single();
      
      if (leaseError || !lease) {
        throw new Error(`No active lease found for vehicle with license plate ${fine.license_plate}`);
      }
      
      if (!hasProperty(lease, 'id') || !hasProperty(lease, 'customer_id')) {
        throw new Error('Invalid lease data returned');
      }
      
      // Update fine with vehicle and lease information
      const updateData = asDatabaseType<any>({
        vehicle_id: vehicle.id,
        lease_id: lease.id,
        assignment_status: 'assigned'
      });
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
        .eq('id', id as any)
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
