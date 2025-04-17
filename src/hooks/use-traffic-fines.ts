
// Import the necessary helper functions
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  asDatabaseType,
  asString,
  asNumber,
  asTrafficFineId,
  safeProperty
} from '@/utils/database-type-helpers';

export interface TrafficFine {
  id: string;
  violationNumber?: string;
  violationDate?: string;
  licensePlate?: string;
  fineAmount: number;
  paymentStatus: 'paid' | 'pending' | 'disputed';
  location?: string;
  violationCharge?: string;
  customerId?: string;
  customerName?: string;
  paymentDate?: string;
}

export function useTrafficFines() {
  const queryClient = useQueryClient();

  // Fetch all traffic fines
  const { data: trafficFines = [], isLoading, error } = useQuery({
    queryKey: ['traffic-fines'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            violation_date,
            license_plate,
            fine_amount,
            payment_status,
            violation_charge,
            fine_location,
            payment_date,
            customer_id,
            profiles (full_name, email, phone_number, nationality)
          `)
          .order('violation_date', { ascending: false });

        if (error) {
          console.error('Error fetching traffic fines:', error);
          throw error;
        }

        // Map the result to the expected format
        return data.map((fine) => {
          const customerProfile = fine.profiles;
          
          return {
            id: fine.id,
            violationNumber: fine.violation_number,
            violationDate: fine.violation_date,
            licensePlate: fine.license_plate,
            fineAmount: fine.fine_amount || 0,
            paymentStatus: (fine.payment_status || 'pending') as 'paid' | 'pending' | 'disputed',
            location: fine.fine_location,
            violationCharge: fine.violation_charge,
            customerId: fine.customer_id,
            customerName: customerProfile ? asString(customerProfile.full_name) : undefined,
            customerPhone: customerProfile ? asString(customerProfile.phone_number) : undefined,
            paymentDate: fine.payment_date,
          };
        });
      } catch (err) {
        console.error('Error in useTrafficFines:', err);
        throw err;
      }
    }
  });

  // Pay a traffic fine
  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast.success('Traffic fine marked as paid');
    },
    onError: (error) => {
      console.error('Error paying traffic fine:', error);
      toast.error('Failed to mark traffic fine as paid');
    }
  });

  // Dispute a traffic fine
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'disputed'
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast.success('Traffic fine marked as disputed');
    },
    onError: (error) => {
      console.error('Error disputing traffic fine:', error);
      toast.error('Failed to mark traffic fine as disputed');
    }
  });

  // Assign a traffic fine to a customer
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // First get the license plate from the traffic fine
      const { data: fineData, error: fineError } = await supabase
        .from('traffic_fines')
        .select('license_plate')
        .eq('id', id)
        .single();

      if (fineError) throw fineError;
      const licensePlate = fineData?.license_plate;

      if (!licensePlate) {
        throw new Error('No license plate found for this fine');
      }

      // Find customer with active agreement for this vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', licensePlate)
        .single();

      if (vehicleError) {
        console.error('Error finding vehicle:', vehicleError);
        throw new Error(`No vehicle found with license plate ${licensePlate}`);
      }

      const vehicleId = vehicleData?.id;

      // Find the most recent agreement for this vehicle
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select(`
          id, 
          customer_id,
          profiles (full_name, email, phone_number, nationality)
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (agreementError) {
        console.error('Error finding agreement:', agreementError);
        throw new Error(`No agreement found for vehicle with ID ${vehicleId}`);
      }

      if (!agreementData || agreementData.length === 0) {
        throw new Error(`No agreement found for vehicle with license plate ${licensePlate}`);
      }

      const customerId = agreementData[0]?.customer_id;
      const customerProfile = agreementData[0]?.profiles;

      if (!customerId) {
        throw new Error(`No customer found for vehicle with license plate ${licensePlate}`);
      }

      // Update the traffic fine with the customer ID
      const { data: updatedFine, error: updateError } = await supabase
        .from('traffic_fines')
        .update({
          customer_id: customerId,
          assignment_status: 'assigned'
        })
        .eq('id', id)
        .select(`
          id,
          violation_number,
          violation_date,
          license_plate,
          fine_amount,
          payment_status,
          violation_charge,
          fine_location,
          payment_date,
          customer_id,
          profiles (full_name, email, phone_number, nationality)
        `)
        .single();

      if (updateError) {
        console.error('Error updating fine with customer:', updateError);
        throw updateError;
      }

      let customerName = '';
      let customerPhone = '';
      
      if (updatedFine.profiles) {
        customerName = updatedFine.profiles.full_name || '';
        customerPhone = updatedFine.profiles.phone_number || '';
      }

      return {
        ...updatedFine,
        customerName,
        customerPhone
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic-fines'] });
      toast.success('Traffic fine assigned to customer');
    },
    onError: (error: Error) => {
      console.error('Error assigning traffic fine:', error);
      toast.error('Failed to assign traffic fine: ' + error.message);
    }
  });

  return {
    trafficFines,
    isLoading,
    error,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer
  };
}
