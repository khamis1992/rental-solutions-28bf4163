import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { asLeaseId } from '@/utils/database-type-helpers';

export interface TrafficFine {
  id: any;
  violationNumber: any;
  violationDate: any;
  licensePlate: any;
  fineAmount: any;
  paymentStatus: "paid" | "pending" | "disputed";
  location: any;
  violationCharge: any;
  customerId: any;
  customerName: string;
  customerPhone: string;
  paymentDate: any;
  lease_id?: string;
}

// Add this interface for createTrafficFine
export interface TrafficFineCreatePayload {
  violationNumber: string;
  violationDate: string | Date;
  licensePlate: string;
  fineAmount: number;
  location?: string;
  violationCharge?: string;
  paymentStatus?: "paid" | "pending" | "disputed";
  paymentDate?: string | Date | null;
}

export function useTrafficFines() {
  const queryClient = useQueryClient();

  const { data: trafficFinesData, isLoading, error } = useQuery({
    queryKey: ['trafficFines'],
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
            location,
            violation_charge,
            customer_id,
            payment_date,
            lease_id,
            customer_data:profiles (
              full_name,
              phone_number
            )
          `);

        if (error) {
          throw new Error(error.message);
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        throw error;
      }
    }
  });

  const trafficFines = trafficFinesData as any[];

  const assignToCustomer = async (fineId: string, customerId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ customer_id: customerId })
        .eq('id', fineId);

      if (error) {
        throw new Error(error.message);
      }

      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine assigned to customer successfully');
    } catch (error) {
      console.error('Error assigning traffic fine to customer:', error);
      toast.error('Failed to assign traffic fine to customer');
    }
  };

  const markAsPaid = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid' })
        .eq('id', fineId);

      if (error) {
        throw new Error(error.message);
      }

      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine marked as paid successfully');
    } catch (error) {
      console.error('Error marking traffic fine as paid:', error);
      toast.error('Failed to mark traffic fine as paid');
    }
  };

  // Fix the customer data access in the methods
  const getTrafficFines = async (): Promise<TrafficFine[]> => {
    try {
      // When accessing customer data, make sure to check array items correctly
      return trafficFines.map(fine => {
        const customerInfo = fine.customer_data && Array.isArray(fine.customer_data) && fine.customer_data.length > 0 
          ? fine.customer_data[0] 
          : { full_name: 'Unknown', phone_number: 'Unknown' };
          
        return {
          id: fine.id,
          violationNumber: fine.violation_number,
          violationDate: fine.violation_date,
          licensePlate: fine.license_plate,
          fineAmount: fine.fine_amount,
          paymentStatus: fine.payment_status || 'pending',
          location: fine.fine_location || fine.location,
          violationCharge: fine.violation_charge,
          customerId: fine.customer_id,
          customerName: customerInfo.full_name || 'Unknown',
          customerPhone: customerInfo.phone_number || 'Unknown',
          paymentDate: fine.payment_date,
          lease_id: fine.lease_id
        };
      });
    } catch (error) {
      console.error('Error transforming traffic fines data:', error);
      return [];
    }
  };

  // Now add the missing methods
  const createTrafficFine = useMutation({
    mutationFn: async (data: TrafficFineCreatePayload) => {
      // Implementation for creating a traffic fine
      const { error } = await supabase.from('traffic_fines').insert([{
        violation_number: data.violationNumber,
        violation_date: data.violationDate,
        license_plate: data.licensePlate,
        fine_amount: data.fineAmount,
        location: data.location,
        violation_charge: data.violationCharge,
        payment_status: data.paymentStatus || 'pending',
        payment_date: data.paymentDate || null,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine created successfully');
    }
  });

  const updateTrafficFine = useMutation({
    mutationFn: async ({id, data}: {id: string, data: Partial<TrafficFineCreatePayload>}) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({
          violation_number: data.violationNumber,
          violation_date: data.violationDate,
          license_plate: data.licensePlate,
          fine_amount: data.fineAmount,
          location: data.location,
          violation_charge: data.violationCharge,
          payment_status: data.paymentStatus,
          payment_date: data.paymentDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine updated successfully');
    }
  });

  const validateLicensePlate = async (licensePlate: string): Promise<boolean> => {
    // Simple validation - in a real application, you'd likely do more verification
    return !!licensePlate && licensePlate.length > 2;
  };

  // Add refetch to the returned API
  return {
    trafficFines,
    isLoading,
    error,
    assignToCustomer,
    markAsPaid,
    createTrafficFine,
    updateTrafficFine,
    validateLicensePlate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['trafficFines'] })
  };
}
