import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  hasData,
  hasProperty,
  asDatabaseType,
  asString,
  asNumber,
  asTrafficFineId,
  safeProperty
} from '@/utils/database-type-helpers';

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
              id: asString(fine.id),
              violation_number: asString(fine.violation_number),
              violationNumber: asString(fine.violation_number),
              violation_date: asString(fine.violation_date),
              violationDate: asString(fine.violation_date),
              fine_amount: asNumber(fine.fine_amount),
              fineAmount: asNumber(fine.fine_amount),
              violation_charge: asString(fine.violation_charge),
              violationCharge: asString(fine.violation_charge),
              fine_location: asString(fine.fine_location),
              location: asString(fine.fine_location),
              license_plate: asString(fine.license_plate),
              licensePlate: asString(fine.license_plate),
              payment_status: asString(fine.payment_status),
              paymentStatus: asString(fine.payment_status),
              lease_id: asString(fine.lease_id)
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
              
              const customerId = hasProperty(lease, 'customer_id') ? asString(lease.customer_id) : '';
              const customerName = profileData && hasProperty(profileData, 'full_name') ? asString(profileData.full_name) : 'Unknown';
              const customerPhone = profileData && hasProperty(profileData, 'phone_number') ? asString(profileData.phone_number) : 'Unknown';
                
              leaseMap[asString(lease.id)] = {
                id: asString(lease.id),
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
                  id: asString(fine.id),
                  violation_number: hasProperty(fine, 'violation_number') ? asString(fine.violation_number) : '',
                  violationNumber: hasProperty(fine, 'violation_number') ? asString(fine.violation_number) : '',
                  license_plate: hasProperty(fine, 'license_plate') ? asString(fine.license_plate) : '',
                  licensePlate: hasProperty(fine, 'license_plate') ? asString(fine.license_plate) : '',
                  violation_date: hasProperty(fine, 'violation_date') ? asString(fine.violation_date) : '',
                  violationDate: hasProperty(fine, 'violation_date') ? asString(fine.violation_date) : '',
                  fine_amount: hasProperty(fine, 'fine_amount') ? asNumber(fine.fine_amount) : 0,
                  fineAmount: hasProperty(fine, 'fine_amount') ? asNumber(fine.fine_amount) : 0,
                  violation_charge: hasProperty(fine, 'violation_charge') ? asString(fine.violation_charge) : '',
                  violationCharge: hasProperty(fine, 'violation_charge') ? asString(fine.violation_charge) : '',
                  validation_status: hasProperty(fine, 'validation_status') ? asString(fine.validation_status) : '',
                  payment_status: hasProperty(fine, 'payment_status') ? asString(fine.payment_status) : '',
                  paymentStatus: hasProperty(fine, 'payment_status') ? asString(fine.payment_status) : '',
                  lease_id: hasProperty(fine, 'lease_id') ? asString(fine.lease_id) : '',
                  vehicle_id: hasProperty(fine, 'vehicle_id') ? asString(fine.vehicle_id) : '',
                  fine_location: hasProperty(fine, 'fine_location') ? asString(fine.fine_location) : '',
                  location: hasProperty(fine, 'fine_location') ? asString(fine.fine_location) : ''
                };
                
                // Add lease information if available
                if (hasProperty(fine, 'lease_id') && fine.lease_id && leaseMap[asString(fine.lease_id)]) {
                  const leaseInfo = leaseMap[asString(fine.lease_id)];
                  return {
                    ...fineData,
                    customerName: leaseInfo.customerName,
                    customerPhone: leaseInfo.customerPhone,
                    customerId: leaseInfo.customerId
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
            id: hasProperty(fine, 'id') ? asString(fine.id) : '',
            violation_number: hasProperty(fine, 'violation_number') ? asString(fine.violation_number) : '',
            violationNumber: hasProperty(fine, 'violation_number') ? asString(fine.violation_number) : '',
            license_plate: hasProperty(fine, 'license_plate') ? asString(fine.license_plate) : '',
            licensePlate: hasProperty(fine, 'license_plate') ? asString(fine.license_plate) : '',
            violation_date: hasProperty(fine, 'violation_date') ? asString(fine.violation_date) : '',
            violationDate: hasProperty(fine, 'violation_date') ? asString(fine.violation_date) : '',
            fine_amount: hasProperty(fine, 'fine_amount') ? asNumber(fine.fine_amount) : 0,
            fineAmount: hasProperty(fine, 'fine_amount') ? asNumber(fine.fine_amount) : 0,
            violation_charge: hasProperty(fine, 'violation_charge') ? asString(fine.violation_charge) : '',
            violationCharge: hasProperty(fine, 'violation_charge') ? asString(fine.violation_charge) : '',
            validation_status: hasProperty(fine, 'validation_status') ? asString(fine.validation_status) : '',
            payment_status: hasProperty(fine, 'payment_status') ? asString(fine.payment_status) : '',
            paymentStatus: hasProperty(fine, 'payment_status') ? asString(fine.payment_status) : '',
            lease_id: hasProperty(fine, 'lease_id') ? asString(fine.lease_id) : '',
            vehicle_id: hasProperty(fine, 'vehicle_id') ? asString(fine.vehicle_id) : '',
            fine_location: hasProperty(fine, 'fine_location') ? asString(fine.fine_location) : '',
            location: hasProperty(fine, 'fine_location') ? asString(fine.fine_location) : ''
          };
          
          return result;
        })
        .filter(Boolean) as TrafficFine[];
    } catch (error) {
      console.error('Error in getTrafficFinesWithDetails:', error);
      return [];
    }
  };
  
  // Add a new traffic fine
  const addTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      const insertData = {
        violation_number: fineData.violationNumber,
        license_plate: fineData.licensePlate,
        violation_date: fineData.violationDate.toISOString(),
        fine_amount: fineData.fineAmount,
        violation_charge: fineData.violationCharge,
        fine_location: fineData.location,
        payment_status: fineData.paymentStatus || 'pending',
        validation_status: 'pending'
      };
      
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
      const dbData = {
        violation_number: updateData.violationNumber,
        license_plate: updateData.licensePlate,
        violation_date: updateData.violationDate,
        fine_amount: updateData.fineAmount,
        violation_charge: updateData.violationCharge,
        fine_location: updateData.location,
        payment_status: updateData.paymentStatus
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
      const updateData = {
        payment_status: 'paid',
        payment_date: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
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
      const updateData = {
        payment_status: 'disputed'
      };
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
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
      
      if (fineError) {
        throw new Error(fineError?.message || 'Fine not found');
      }
      
      if (!fine) {
        throw new Error('Fine not found');
      }
      
      if (!hasProperty(fine, 'license_plate') || !fine.license_plate) {
        throw new Error('Cannot assign fine without a license plate');
      }
      
      // Find vehicle by license plate
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fine.license_plate)
        .single();
      
      if (vehicleError) {
        throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
      }
      
      if (!vehicle) {
        throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
      }
      
      if (!hasProperty(vehicle, 'id')) {
        throw new Error('Invalid vehicle data returned');
      }
      
      // Find active lease for this vehicle
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, customer_id')
        .eq('vehicle_id', asString(vehicle.id))
        .eq('status', 'active')
        .single();
      
      if (leaseError) {
        throw new Error(`No active lease found for vehicle with license plate ${asString(fine.license_plate)}`);
      }
      
      if (!lease) {
        throw new Error(`No active lease found for vehicle with license plate ${asString(fine.license_plate)}`);
      }
      
      if (!hasProperty(lease, 'id') || !hasProperty(lease, 'customer_id')) {
        throw new Error('Invalid lease data returned');
      }
      
      // Update fine with vehicle and lease information
      const updateData = {
        vehicle_id: asString(vehicle.id),
        lease_id: asString(lease.id),
        assignment_status: 'assigned'
      };
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
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
    refetch
  };
};
