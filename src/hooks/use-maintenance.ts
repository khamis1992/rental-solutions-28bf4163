
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { asMaintenanceId, asVehicleId, isQueryDataValid } from '@/utils/database-type-helpers';

// Define proper type for maintenance record
export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  service_type: string;
  maintenance_type?: string;
  status: string;
  description?: string;
  cost?: number;
  scheduled_date: Date | string;
  completed_date?: Date | string;
  performed_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export function useMaintenance() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Get all maintenance records
  const getAllRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all maintenance records:', error);
      return [];
    }
  };

  // Get maintenance records for a vehicle
  const getMaintenanceRecordsByVehicle = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting maintenance records:', error);
      return [];
    }
  };

  // Get a single maintenance record
  const getMaintenanceRecord = async (maintenanceId: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('id', asMaintenanceId(maintenanceId))
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting maintenance record:', error);
      return null;
    }
  };

  // Create a new maintenance record
  const createMaintenanceRecord = async (record: MaintenanceRecord) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast.success('Maintenance record created successfully');
      return data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast.error('Failed to create maintenance record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a maintenance record
  const updateMaintenanceRecord = async (maintenanceId: string, updates: Partial<MaintenanceRecord>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .update(updates)
        .eq('id', asMaintenanceId(maintenanceId))
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast.success('Maintenance record updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast.error('Failed to update maintenance record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a maintenance record
  const deleteMaintenanceRecord = async (maintenanceId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', asMaintenanceId(maintenanceId));

      if (error) throw error;
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast.success('Maintenance record deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      toast.error('Failed to delete maintenance record');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get upcoming maintenance
  const getUpcomingMaintenance = async () => {
    try {
      const today = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, vehicles(*)')
        .gt('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting upcoming maintenance:', error);
      return [];
    }
  };

  // Get maintenance history for a vehicle
  const getMaintenanceHistory = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting maintenance history:', error);
      return [];
    }
  };

  // React Query hooks
  const useMaintenanceList = (vehicleId?: string) => {
    return useQuery({
      queryKey: ['maintenanceList', vehicleId],
      queryFn: () => vehicleId ? getMaintenanceRecordsByVehicle(vehicleId) : [],
      enabled: !!vehicleId,
    });
  };

  const useMaintenanceDetails = (maintenanceId?: string) => {
    return useQuery({
      queryKey: ['maintenanceDetails', maintenanceId],
      queryFn: () => maintenanceId ? getMaintenanceRecord(maintenanceId) : null,
      enabled: !!maintenanceId,
    });
  };

  const useUpcomingMaintenance = () => {
    return useQuery({
      queryKey: ['upcomingMaintenance'],
      queryFn: getUpcomingMaintenance,
    });
  };

  const useMaintenanceHistory = (vehicleId?: string) => {
    return useQuery({
      queryKey: ['maintenanceHistory', vehicleId],
      queryFn: () => vehicleId ? getMaintenanceHistory(vehicleId) : [],
      enabled: !!vehicleId,
    });
  };

  const useCreateMaintenance = () => {
    return useMutation({
      mutationFn: createMaintenanceRecord,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      },
    });
  };

  const useUpdateMaintenance = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }) => 
        updateMaintenanceRecord(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      },
    });
  };

  const useDeleteMaintenance = () => {
    return useMutation({
      mutationFn: deleteMaintenanceRecord,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      },
    });
  };

  // Create function for MaintenanceSchedulingWizard
  const create = useCreateMaintenance();

  return {
    loading,
    getAllRecords,
    getMaintenanceRecordsByVehicle,
    getMaintenanceRecord,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    getUpcomingMaintenance,
    getMaintenanceHistory,
    useMaintenanceList,
    useMaintenanceDetails,
    useUpcomingMaintenance,
    useMaintenanceHistory,
    useCreateMaintenance,
    useUpdateMaintenance,
    useDeleteMaintenance,
    create
  };
}
