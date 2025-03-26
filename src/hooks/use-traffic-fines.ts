
import { useState } from 'react';
import { useToast } from './use-toast';
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
  const { toast } = useToast();
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

        // Additional query to get customer names if needed
        const customerIds = data
          .filter(fine => fine.customer_id)
          .map(fine => fine.customer_id);
        
        let customerMap: Record<string, string> = {};
        
        if (customerIds.length > 0) {
          const { data: customers } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', customerIds);
            
          if (customers) {
            customerMap = customers.reduce((acc, customer) => {
              acc[customer.id] = customer.full_name;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        return (data || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
          licensePlate: fine.license_plate,
          vehicleModel: undefined, // We'll need to update this based on the actual data structure
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: (fine.payment_status || 'pending') as TrafficFineStatusType,
          location: fine.fine_location, // Use fine_location field
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
          customerId: fine.customer_id,
          customerName: fine.customer_id ? customerMap[fine.customer_id] : undefined,
          leaseId: fine.lease_id
        }));
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
        vehicleModel: undefined, // No corresponding field in database
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location, // Map from fine_location field
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        customerId: data.customer_id,
        customerName: undefined, // Will get this from a separate query if needed
        leaseId: data.lease_id
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Traffic fine added',
          description: 'Traffic fine has been added successfully.',
        });
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
      
      // Get the customer name if needed
      let customerName;
      if (responseData.customer_id) {
        const { data: customer } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', responseData.customer_id)
          .single();
          
        if (customer) {
          customerName = customer.full_name;
        }
      }
      
      return {
        id: responseData.id,
        violationNumber: responseData.violation_number,
        licensePlate: responseData.license_plate,
        vehicleModel: undefined, // No corresponding field in database
        violationDate: new Date(responseData.violation_date),
        fineAmount: responseData.fine_amount,
        violationCharge: responseData.violation_charge,
        paymentStatus: responseData.payment_status as TrafficFineStatusType,
        location: responseData.fine_location, // Map from fine_location field
        vehicleId: responseData.vehicle_id,
        paymentDate: responseData.payment_date ? new Date(responseData.payment_date) : undefined,
        customerId: responseData.customer_id,
        customerName: customerName,
        leaseId: responseData.lease_id
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Traffic fine updated',
          description: 'Traffic fine has been updated successfully.',
        });
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
        toast({
          title: 'Traffic fine deleted',
          description: 'Traffic fine has been deleted successfully.',
        });
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
      
      // Get the customer name if needed
      let customerName;
      if (data.customer_id) {
        const { data: customer } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.customer_id)
          .single();
          
        if (customer) {
          customerName = customer.full_name;
        }
      }
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: undefined, // No corresponding field in database
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location, // Map from fine_location field
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        customerId: data.customer_id,
        customerName: customerName,
        leaseId: data.lease_id
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Payment processed',
          description: 'Traffic fine payment has been processed successfully.',
        });
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
      
      // Get the customer name if needed
      let customerName;
      if (data.customer_id) {
        const { data: customer } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.customer_id)
          .single();
          
        if (customer) {
          customerName = customer.full_name;
        }
      }
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: undefined, // No corresponding field in database
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status as TrafficFineStatusType,
        location: data.fine_location, // Map from fine_location field
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        customerId: data.customer_id,
        customerName: customerName,
        leaseId: data.lease_id
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Dispute submitted',
          description: 'Traffic fine dispute has been submitted successfully.',
        });
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
      const { data: fine, error: fineError } = await supabase
        .from('traffic_fines')
        .select('license_plate, violation_date, fine_location, fine_amount, violation_charge, violation_number')
        .eq('id', id)
        .single();
        
      if (fineError) throw fineError;
      
      if (!fine.license_plate) {
        throw new Error('Cannot assign fine without a license plate');
      }
      
      // Find the vehicle associated with this license plate
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fine.license_plate)
        .maybeSingle();
        
      if (vehicleError) throw vehicleError;
      
      if (!vehicle) {
        throw new Error(`No vehicle found with license plate ${fine.license_plate}`);
      }
      
      // Find an active lease for this vehicle at the time of the violation
      const violationDate = new Date(fine.violation_date);
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, customer_id')
        .eq('vehicle_id', vehicle.id)
        .lte('start_date', violationDate.toISOString())
        .gte('end_date', violationDate.toISOString())
        .maybeSingle();
        
      if (leaseError) throw leaseError;
      
      if (!lease) {
        throw new Error(`No active lease found for this vehicle on ${violationDate.toDateString()}`);
      }
      
      // Update the fine with the customer and lease information
      const { data: updatedFine, error: updateError } = await supabase
        .from('traffic_fines')
        .update({
          customer_id: lease.customer_id,
          lease_id: lease.id,
          vehicle_id: vehicle.id
        })
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Get the customer name
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', lease.customer_id)
        .single();
        
      if (customerError) throw customerError;
      
      const customerName = customer ? customer.full_name : undefined;
      
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
        customerId: updatedFine.customer_id,
        customerName: customerName,
        leaseId: updatedFine.lease_id
      };
    },
    {
      onSuccess: (data) => {
        toast({
          title: 'Fine assigned',
          description: `Traffic fine has been assigned to ${data.customerName || 'customer'}.`,
        });
        refetch();
      },
      onError: (error) => {
        console.error('Error assigning fine:', error);
        toast({
          title: 'Assignment failed',
          description: error instanceof Error ? error.message : 'Failed to assign fine to customer',
          variant: 'destructive'
        });
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
