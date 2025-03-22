
import { useState } from 'react';
import { useToast } from './use-toast';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/integrations/supabase/client';

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

        return (data || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
          licensePlate: fine.license_plate,
          vehicleModel: fine.vehicle_model,
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.location,
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined
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
          vehicle_model: fineData.vehicleModel,
          violation_date: fineData.violationDate.toISOString(),
          fine_amount: fineData.fineAmount,
          violation_charge: fineData.violationCharge,
          payment_status: fineData.paymentStatus,
          location: fineData.location,
          vehicle_id: fineData.vehicleId
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: data.vehicle_model,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status,
        location: data.location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined
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
      if (data.vehicleModel) updateData.vehicle_model = data.vehicleModel;
      if (data.violationDate) updateData.violation_date = data.violationDate.toISOString();
      if (data.fineAmount) updateData.fine_amount = data.fineAmount;
      if (data.violationCharge) updateData.violation_charge = data.violationCharge;
      if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
      if (data.location) updateData.location = data.location;
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
        vehicleModel: responseData.vehicle_model,
        violationDate: new Date(responseData.violation_date),
        fineAmount: responseData.fine_amount,
        violationCharge: responseData.violation_charge,
        paymentStatus: responseData.payment_status,
        location: responseData.location,
        vehicleId: responseData.vehicle_id,
        paymentDate: responseData.payment_date ? new Date(responseData.payment_date) : undefined
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
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: data.vehicle_model,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status,
        location: data.location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined
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
      
      return {
        id: data.id,
        violationNumber: data.violation_number,
        licensePlate: data.license_plate,
        vehicleModel: data.vehicle_model,
        violationDate: new Date(data.violation_date),
        fineAmount: data.fine_amount,
        violationCharge: data.violation_charge,
        paymentStatus: data.payment_status,
        location: data.location,
        vehicleId: data.vehicle_id,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined
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
  };
}
