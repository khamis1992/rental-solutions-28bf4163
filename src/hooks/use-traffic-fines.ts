
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed' | 'processing';

export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: string;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  vehicle_id?: string;
  lease_id?: string;
}

export type TrafficFineFilters = {
  status?: string;
  vehicleId?: string;
  leaseId?: string;
  startDate?: Date;
  endDate?: Date;
};

export const useTrafficFines = (initialFilters: TrafficFineFilters = {}) => {
  const [filters, setFilters] = useState<TrafficFineFilters>(initialFilters);

  // Fetch traffic fines with filters
  const { data: trafficFines, isLoading, refetch } = useApiQuery(
    ['trafficFines', JSON.stringify(filters)],
    async () => {
      try {
        let query = supabase
          .from('traffic_fines')
          .select('*');

        // Apply filters
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.leaseId) {
          query = query.eq('lease_id', filters.leaseId);
        }
        
        if (filters.startDate) {
          query = query.gte('violation_date', filters.startDate.toISOString());
        }
        
        if (filters.endDate) {
          query = query.lte('violation_date', filters.endDate.toISOString());
        }

        const { data, error } = await query.order('violation_date', { ascending: false });

        if (error) throw error;

        // Transform from snake_case to camelCase
        return (data || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number,
          licensePlate: fine.license_plate,
          violationDate: fine.violation_date,
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.fine_location,
          vehicle_id: fine.vehicle_id,
          lease_id: fine.lease_id
        }));
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        throw error;
      }
    },
    {
      gcTime: 60000, // Use gcTime instead of cacheTime
      refetchOnWindowFocus: false
    }
  );

  // Create new traffic fine
  const createTrafficFine = useApiMutation(
    async (fineData: Omit<TrafficFine, 'id'>) => {
      // Transform from camelCase to snake_case
      const dbData = {
        violation_number: fineData.violationNumber,
        license_plate: fineData.licensePlate,
        violation_date: fineData.violationDate,
        fine_amount: fineData.fineAmount,
        violation_charge: fineData.violationCharge,
        payment_status: fineData.paymentStatus,
        fine_location: fineData.location,
        vehicle_id: fineData.vehicle_id,
        lease_id: fineData.lease_id
      };

      const { data, error } = await supabase
        .from('traffic_fines')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Traffic fine added successfully');
        refetch();
      }
    }
  );

  // Update traffic fine status
  const updateTrafficFineStatus = useApiMutation(
    async ({ id, status }: { id: string; status: TrafficFineStatusType }) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Traffic fine status updated');
        refetch();
      }
    }
  );

  return {
    trafficFines,
    isLoading,
    filters,
    setFilters,
    createTrafficFine,
    updateTrafficFineStatus,
    refetch
  };
};
