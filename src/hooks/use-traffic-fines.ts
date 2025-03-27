
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  vehicleModel?: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  vehicleId?: string;
  paymentDate?: Date;
  customerId?: string;
  customerName?: string;
  leaseId?: string;
}

export function useTrafficFines() {
  const [filters, setFilters] = useState({
    vehicleId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const { data: trafficFines, isLoading, refetch } = useApiQuery<TrafficFine[]>(
    ['trafficFines', JSON.stringify(filters)], 
    async () => {
      try {
        let query = supabase
          .from('traffic_fines')
          .select('*');

        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.dateFrom) {
          query = query.gte('violation_date', filters.dateFrom);
        }
        
        if (filters.dateTo) {
          query = query.lte('violation_date', filters.dateTo);
        }

        const { data, error } = await query.order('violation_date', { ascending: false });

        if (error) throw error;

        // First process the traffic fines to get basic data
        const processedFines: TrafficFine[] = (data || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
          licensePlate: fine.license_plate,
          vehicleModel: undefined,
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: (fine.payment_status || 'pending') as TrafficFineStatusType,
          location: fine.fine_location,
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
          customerId: undefined,
          customerName: undefined,
          leaseId: fine.lease_id
        }));
        
        // Only enrich with customer data if we have fines with lease IDs
        const finesWithLease = processedFines.filter(fine => fine.leaseId);
        
        if (finesWithLease.length > 0) {
          // Get all lease IDs
          const leaseIds = finesWithLease.map(fine => fine.leaseId).filter(Boolean);
          
          // Get all the lease data in one query using explicit joins
          // This avoids the "relationship not found" error
          const { data: leaseData, error: leaseError } = await supabase
            .from('leases')
            .select('id, customer_id')
            .in('id', leaseIds);
            
          if (leaseError) {
            console.error('Error fetching lease data:', leaseError);
            return processedFines; // Return what we have so far
          }
          
          // Create a map of lease IDs to customer IDs
          const leaseToCustomerMap = new Map();
          leaseData?.forEach(lease => {
            if (lease.customer_id) {
              leaseToCustomerMap.set(lease.id, lease.customer_id);
            }
          });
          
          // Get all valid customer IDs
          const customerIds = Array.from(leaseToCustomerMap.values());
          
          if (customerIds.length === 0) {
            return processedFines; // No valid customer IDs found
          }
          
          // Fetch customer data separately
          const { data: customerData, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', customerIds);
            
          if (customerError) {
            console.error('Error fetching customer data:', customerError);
            return processedFines; // Return what we have so far
          }
          
          // Create a map for faster lookups
          const customerDetailsMap = new Map();
          customerData?.forEach(customer => {
            customerDetailsMap.set(customer.id, {
              customerId: customer.id,
              customerName: customer.full_name
            });
          });
          
          // Now enrich the fines with customer information
          processedFines.forEach(fine => {
            if (fine.leaseId) {
              const customerId = leaseToCustomerMap.get(fine.leaseId);
              if (customerId) {
                const customerDetails = customerDetailsMap.get(customerId);
                if (customerDetails) {
                  fine.customerId = customerDetails.customerId;
                  fine.customerName = customerDetails.customerName;
                }
              }
            }
          });
        }
        
        return processedFines;
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        return [];
      }
    }
  );

  const createTrafficFineMutation = useApiMutation<TrafficFine, unknown, Omit<TrafficFine, 'id'>>(
    async (fineData) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert({
          violation_number: fineData.violationNumber,
          license_plate: fineData.licensePlate,
          violation_date: fineData.violationDate.toISOString(),
          fine_amount: fineData.fineAmount,
          violation_charge: fineData.violationCharge,
          payment_status: fineData.paymentStatus,
          fine_location: fineData.location,
          vehicle_id: fineData.vehicleId
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: undefined,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        leaseId: data.lease_id,
        customerId: undefined,
        customerName: undefined
      };
    },
    {
      onSuccess: () => {
        toast.success('Traffic fine added');
        refetch();
      }
    }
  );

  const updateTrafficFineMutation = useApiMutation<
    TrafficFine, 
    unknown, 
    { id: string; data: Partial<TrafficFine> }
  >(
    async ({ id, data }) => {
      const updateData: any = {};
      if (data.violationNumber) updateData.violation_number = data.violationNumber;
      if (data.licensePlate) updateData.license_plate = data.licensePlate;
      if (data.violationDate) updateData.violation_date = data.violationDate.toISOString();
      if (data.fineAmount) updateData.fine_amount = data.fineAmount;
      if (data.violationCharge) updateData.violation_charge = data.violationCharge;
      if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
      if (data.location) updateData.fine_location = data.location;
      if (data.vehicleId) updateData.vehicle_id = data.vehicleId;
      if (data.paymentDate) updateData.payment_date = data.paymentDate.toISOString();

      const { data: responseData, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: responseData.id,
        violationNumber: responseData.violation_number,
        licensePlate: responseData.license_plate,
        vehicleModel: undefined,
        violationDate: new Date(responseData.violation_date),
        fineAmount: responseData.fine_amount,
        violationCharge: responseData.violation_charge,
        paymentStatus: responseData.payment_status as TrafficFineStatusType,
        location: responseData.fine_location,
        vehicleId: responseData.vehicle_id,
        paymentDate: responseData.payment_date ? new Date(responseData.payment_date) : undefined,
        leaseId: responseData.lease_id,
        customerId: undefined,
        customerName: undefined
      };
    },
    {
      onSuccess: () => {
        toast.success('Traffic fine updated');
        refetch();
      }
    }
  );

  const deleteTrafficFineMutation = useApiMutation<string, unknown, string>(
    async (id) => {
      const { error } = await supabase
        .from('traffic_fines')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    {
      onSuccess: () => {
        toast.success('Traffic fine deleted');
        refetch();
      }
    }
  );

  const payTrafficFineMutation = useApiMutation<
    TrafficFine,
    unknown,
    { id: string; paymentDetails?: any }
  >(
    async ({ id }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: undefined,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        leaseId: data.lease_id,
        customerId: undefined,
        customerName: undefined
      };
    },
    {
      onSuccess: () => {
        toast.success('Payment processed');
        refetch();
      }
    }
  );

  const disputeTrafficFineMutation = useApiMutation<
    TrafficFine,
    unknown,
    { id: string; disputeDetails?: any }
  >(
    async ({ id }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'disputed'
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: undefined,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        leaseId: data.lease_id,
        customerId: undefined,
        customerName: undefined
      };
    },
    {
      onSuccess: () => {
        toast.success('Dispute submitted');
        refetch();
      }
    }
  );

  const assignToCustomerMutation = useApiMutation<
    TrafficFine,
    unknown,
    { id: string }
  >(
    async ({ id }) => {
      try {
        // Input validation
        if (!id) {
          throw new Error('Invalid traffic fine ID');
        }
        
        console.log(`Starting assignment process for fine ID: ${id}`);
        
        // Step 1: Get traffic fine details with robust error handling
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate, violation_date, fine_location, fine_amount, violation_charge, violation_number')
          .eq('id', id)
          .single();
          
        if (fineError) {
          console.error('Error fetching traffic fine:', fineError);
          throw new Error(`Could not retrieve traffic fine: ${fineError.message}`);
        }
        
        if (!fine) {
          throw new Error('Traffic fine not found');
        }
        
        // Data validation
        if (!fine.license_plate) {
          throw new Error('Cannot assign fine: Missing license plate information');
        }
        
        if (!fine.violation_date) {
          throw new Error('Cannot assign fine: Missing violation date');
        }
        
        console.log(`Attempting to assign fine for license plate: ${fine.license_plate} on date: ${fine.violation_date}`);
        
        // Step 2: Find the vehicle by license plate using explicit query
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, make, model')
          .eq('license_plate', fine.license_plate)
          .single();
          
        if (vehicleError) {
          console.error('Error finding vehicle:', vehicleError);
          throw new Error(`Vehicle lookup failed: ${vehicleError.message}`);
        }
        
        if (!vehicle) {
          throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
        }
        
        console.log(`Found vehicle: ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id}) for license plate: ${fine.license_plate}`);
        
        const violationDate = new Date(fine.violation_date);
        
        console.log(`Looking for active lease at violation date: ${violationDate.toISOString()}`);
        
        // Step 3: Find the active lease for this vehicle on the violation date using explicit join
        // This avoids relying on implicit relationships that were causing the error
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id, agreement_number, start_date, end_date')
          .eq('vehicle_id', vehicle.id)
          .lte('start_date', violationDate.toISOString())
          .gte('end_date', violationDate.toISOString());
          
        if (leaseError) {
          console.error('Error finding lease:', leaseError);
          throw new Error(`Lease lookup failed: ${leaseError.message}`);
        }
        
        if (!leaseData || leaseData.length === 0) {
          throw new Error(`No active lease found for vehicle ${vehicle.make} ${vehicle.model} on ${violationDate.toDateString()}`);
        }
        
        // In case there are multiple leases (which shouldn't happen with proper data), take the first one
        const lease = leaseData[0];
        
        if (!lease.customer_id) {
          throw new Error(`Lease #${lease.agreement_number} found but has no associated customer ID`);
        }
        
        console.log(`Found lease ID: ${lease.id}, customer ID: ${lease.customer_id} for agreement: ${lease.agreement_number}`);
        
        // Step 4: Get customer details with explicit query
        const { data: customer, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', lease.customer_id)
          .single();
        
        if (customerError) {
          console.error('Error fetching customer details:', customerError);
          throw new Error(`Customer lookup failed: ${customerError.message}`);
        }
        
        if (!customer) {
          throw new Error(`Customer with ID ${lease.customer_id} not found`);
        }
        
        console.log(`Found customer: ${customer.full_name} (ID: ${customer.id})`);
        
        // Step 5: Update the traffic fine with the lease and vehicle info
        const { data: updatedFine, error: updateError } = await supabase
          .from('traffic_fines')
          .update({
            lease_id: lease.id,
            vehicle_id: vehicle.id,
            assignment_status: 'assigned'
          })
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating traffic fine:', updateError);
          throw new Error(`Failed to update traffic fine: ${updateError.message}`);
        }
        
        if (!updatedFine) {
          throw new Error('Failed to update traffic fine record');
        }
        
        console.log(`Successfully assigned fine ID: ${id} to customer: ${customer.full_name}`);
        
        // Return the updated fine with customer info
        return {
          id: updatedFine.id,
          violationNumber: updatedFine.violation_number,
          licensePlate: updatedFine.license_plate,
          vehicleModel: `${vehicle.make} ${vehicle.model}`,
          violationDate: new Date(updatedFine.violation_date),
          fineAmount: updatedFine.fine_amount,
          violationCharge: updatedFine.violation_charge,
          paymentStatus: updatedFine.payment_status as TrafficFineStatusType,
          location: updatedFine.fine_location,
          vehicleId: updatedFine.vehicle_id,
          paymentDate: updatedFine.payment_date ? new Date(updatedFine.payment_date) : undefined,
          customerId: customer.id,
          customerName: customer.full_name,
          leaseId: updatedFine.lease_id
        };
      } catch (error) {
        console.error('Error in assignToCustomer:', error);
        // Enhanced error reporting with contextual information
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to assign fine to customer';
          
        // Surface more specific error messages based on error context
        if (errorMessage.includes('license plate')) {
          throw new Error(`Assignment failed: ${errorMessage}. Check if the license plate is correctly entered.`);
        } else if (errorMessage.includes('lease')) {
          throw new Error(`Assignment failed: ${errorMessage}. Verify there is an active rental agreement for this vehicle on the violation date.`);
        } else if (errorMessage.includes('customer')) {
          throw new Error(`Assignment failed: ${errorMessage}. Ensure the customer record exists and is properly linked.`);
        } else {
          throw new Error(`Fine assignment failed: ${errorMessage}`);
        }
      }
    },
    {
      onSuccess: (data) => {
        toast.success(`Fine assigned to ${data.customerName || 'customer'}`);
        refetch();
      },
      onError: (error) => {
        console.error('Error assigning fine:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to assign fine to customer');
      }
    }
  );

  return {
    trafficFines,
    isLoading,
    filters,
    setFilters,
    createTrafficFine: createTrafficFineMutation.mutate,
    updateTrafficFine: updateTrafficFineMutation.mutate,
    deleteTrafficFine: deleteTrafficFineMutation.mutate,
    payTrafficFine: payTrafficFineMutation.mutate,
    disputeTrafficFine: disputeTrafficFineMutation.mutate,
    assignToCustomer: assignToCustomerMutation.mutate,
  };
}
