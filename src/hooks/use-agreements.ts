import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useAgreements = (options: {
  customerId?: string;
  vehicleId?: string;
  page?: number;
  pageSize?: number;
  columns?: string;
} = {}) => {
  const queryClient = useQueryClient();
  const { customerId, vehicleId, page = 1, pageSize = 10, columns } = options;

  // Calculate pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Create a cache key that includes pagination and filter parameters
  const cacheKey = ['agreements', customerId, vehicleId, page, pageSize];
  
  // Default columns to select if not specified
  const defaultColumns = 'id,agreement_number,customer_id,vehicle_id,start_date,end_date,status,total_amount,created_at,updated_at,vehicle:vehicle_id(id,make,model,license_plate)';
  const selectColumns = columns || defaultColumns;
  
  const {
    data: agreements,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      console.log(`Fetching agreements - page ${page}, pageSize ${pageSize}`);
      console.log(`Selected columns: ${selectColumns}`);

      try {
        let query = supabase
          .from('agreements')
          .select(selectColumns)
          .range(from, to)
          .order('created_at', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        if (vehicleId) {
          query = query.eq('vehicle_id', vehicleId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching agreements:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Unexpected error in agreements fetch:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get a single agreement by ID with optimized column selection
  const getAgreement = async (id: string, selectColumns?: string) => {
    try {
      const columns = selectColumns || 'id,agreement_number,customer_id,vehicle_id,start_date,end_date,status,total_amount,created_at,updated_at,vehicle:vehicle_id(*),customer:customer_id(*)';
      
      // Check cache first
      const cachedAgreement = queryClient.getQueryData(['agreement', id]);
      if (cachedAgreement) {
        return cachedAgreement;
      }
      
      const { data, error } = await supabase
        .from('agreements')
        .select(columns)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching agreement:', error);
        throw error;
      }

      // Cache the result
      queryClient.setQueryData(['agreement', id], data);
      
      return data;
    } catch (error) {
      console.error('Error in getAgreement:', error);
      return null;
    }
  };

  const createAgreement = useMutation({
    mutationFn: async (newAgreement: any) => {
      const { data, error } = await supabase
        .from('agreements')
        .insert([newAgreement])
        .select()
        .single();

      if (error) {
        console.error('Error creating agreement:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create agreement', { description: error.message });
    },
  });

  const updateAgreement = useMutation({
    mutationFn: async (agreement: any) => {
      const { data, error } = await supabase
        .from('agreements')
        .update(agreement)
        .eq('id', agreement.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating agreement:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update agreement', { description: error.message });
    },
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting agreement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete agreement', { description: error.message });
    },
  });

  return {
    agreements,
    isLoading,
    error,
    refetch,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
  };
};
