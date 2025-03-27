
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

        // Process the traffic fines first before trying to fetch customer data
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
        
        // Now enhance the fines with customer information where available
        const processedFinesWithCustomerInfo = [...processedFines];
        
        // Process only fines with lease_id
        const finesWithLease = processedFines.filter(fine => fine.leaseId);
        
        if (finesWithLease.length > 0) {
          // Get all lease IDs
          const leaseIds = finesWithLease.map(fine => fine.leaseId);
          
          // Fetch all leases in one query
          const { data: leasesData, error: leasesError } = await supabase
            .from('leases')
            .select('id, customer_id')
            .in('id', leaseIds);
            
          if (leasesError) {
            console.error('Error fetching lease data:', leasesError);
          } else {
            // Create a map of lease_id to customer_id for quick lookups
            const leaseToCustomerMap = new Map();
            leasesData?.forEach(lease => {
              if (lease.customer_id) {
                leaseToCustomerMap.set(lease.id, lease.customer_id);
              }
            });
            
            // Get all unique customer IDs
            const customerIds = [...new Set(leasesData?.map(lease => lease.customer_id).filter(Boolean))];
            
            if (customerIds.length > 0) {
              // Fetch all customer profiles in one query
              const { data: customersData, error: customersError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', customerIds);
                
              if (customersError) {
                console.error('Error fetching customer data:', customersError);
              } else {
                // Create a map of customer_id to full_name for quick lookups
                const customerMap = new Map();
                customersData?.forEach(customer => {
                  customerMap.set(customer.id, customer.full_name);
                });
                
                // Update the processed fines with customer info
                processedFinesWithCustomerInfo.forEach(fine => {
                  if (fine.leaseId) {
                    const customerId = leaseToCustomerMap.get(fine.leaseId);
                    if (customerId) {
                      fine.customerId = customerId;
                      fine.customerName = customerMap.get(customerId);
                    }
                  }
                });
              }
            }
          }
        }
        
        return processedFinesWithCustomerInfo;
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
        // Step 1: Get traffic fine details
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate, violation_date, fine_location, fine_amount, violation_charge, violation_number')
          .eq('id', id)
          .single();
          
        if (fineError) {
          console.error('Error fetching traffic fine:', fineError);
          throw fineError;
        }
        
        if (!fine) {
          throw new Error('Traffic fine not found');
        }
        
        if (!fine.license_plate) {
          throw new Error('Cannot assign fine without a license plate');
        }
        
        console.log(`Attempting to assign fine for license plate: ${fine.license_plate}`);
        
        // Step 2: Find the vehicle by license plate
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', fine.license_plate)
          .single();
          
        if (vehicleError) {
          console.error('Error finding vehicle:', vehicleError);
          throw vehicleError;
        }
        
        if (!vehicle) {
          throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
        }
        
        console.log(`Found vehicle ID: ${vehicle.id} for license plate: ${fine.license_plate}`);
        
        const violationDate = new Date(fine.violation_date);
        
        console.log(`Looking for active lease at violation date: ${violationDate.toISOString()}`);
        
        // Step 3: Find the active lease for this vehicle on the violation date
        const { data: lease, error: leaseError } = await supabase
          .from('leases')
          .select('id, customer_id, agreement_number')
          .eq('vehicle_id', vehicle.id)
          .lte('start_date', violationDate.toISOString())
          .gte('end_date', violationDate.toISOString())
          .single();
          
        if (leaseError) {
          console.error('Error finding lease:', leaseError);
          throw leaseError;
        }
        
        if (!lease) {
          throw new Error(`No active lease found for this vehicle on ${violationDate.toDateString()}`);
        }
        
        console.log(`Found lease ID: ${lease.id}, customer ID: ${lease.customer_id} for agreement: ${lease.agreement_number}`);
        
        // Step 4: Get the customer details
        const { data: customer, error: customerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', lease.customer_id)
          .single();
          
        if (customerError) {
          console.error('Error finding customer:', customerError);
          throw customerError;
        }
        
        if (!customer) {
          throw new Error(`Customer not found for ID: ${lease.customer_id}`);
        }
        
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
          throw updateError;
        }
        
        if (!updatedFine) {
          throw new Error('Failed to update traffic fine');
        }
        
        console.log(`Successfully assigned fine ID: ${id} to customer: ${customer.full_name}`);
        
        // Return the updated fine with customer info
        return {
          id: updatedFine.id,
          violationNumber: updatedFine.violation_number,
          licensePlate: updatedFine.license_plate,
          vehicleModel: undefined,
          violationDate: new Date(updatedFine.violation_date),
          fineAmount: updatedFine.fine_amount,
          violationCharge: updatedFine.violation_charge,
          paymentStatus: updatedFine.payment_status as TrafficFineStatusType,
          location: updatedFine.fine_location,
          vehicleId: updatedFine.vehicle_id,
          paymentDate: updatedFine.payment_date ? new Date(updatedFine.payment_date) : undefined,
          customerId: lease.customer_id,
          customerName: customer.full_name,
          leaseId: updatedFine.lease_id
        };
      } catch (error) {
        console.error('Error in assignToCustomer:', error);
        throw error;
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
