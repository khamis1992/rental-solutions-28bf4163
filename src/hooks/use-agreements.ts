
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleAgreement } from '@/types/agreement';

interface UseAgreementsOptions {
  customerId?: string;
  vehicleId?: string;
  page?: number;
  pageSize?: number;
  columns?: string;
  status?: string;
  query?: string;
}

export const useAgreements = (options: UseAgreementsOptions = {}) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({ 
    status: options.status || 'all',
    query: options.query || ''
  });

  // Fetch agreements with optional filtering
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agreements', options, searchParams],
    queryFn: async () => {
      try {
        console.log('Fetching agreements with options:', { ...options, ...searchParams });

        // Set up the base query
        const { customerId, vehicleId, page = 1, pageSize = 10 } = options;
        const offset = (page - 1) * pageSize;
        
        // Select columns or use default
        const selectColumns = options.columns || '*, customers:profiles(*), vehicles(*)';

        let query = supabase
          .from('leases')
          .select(selectColumns)
          .range(offset, offset + pageSize - 1)
          .order('created_at', { ascending: false });

        // Apply filters
        if (customerId) {
          query = query.eq('customer_id', customerId);
        }
        
        if (vehicleId) {
          query = query.eq('vehicle_id', vehicleId);
        }

        // Apply status filter if not 'all'
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }

        // Apply search query if provided
        if (searchParams.query) {
          query = query.or(`agreement_number.ilike.%${searchParams.query}%`);
        }

        const { data: agreements, error } = await query;

        if (error) {
          throw error;
        }

        // Safe type casting
        return agreements as unknown as SimpleAgreement[];
      } catch (error) {
        console.error('Error fetching agreements:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get a single agreement by ID
  const getAgreement = async (id: string, selectColumns?: string) => {
    try {
      const columns = selectColumns || '*, customers:profiles(*), vehicles(*)';
      
      const { data, error } = await supabase
        .from('leases')
        .select(columns)
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data as unknown as SimpleAgreement;
    } catch (error) {
      console.error('Error fetching agreement:', error);
      throw error;
    }
  };

  // Create a new agreement
  const createAgreement = useMutation({
    mutationFn: async (newAgreement: any) => {
      const { data, error } = await supabase
        .from('leases')
        .insert(newAgreement)
        .select();
        
      if (error) {
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: (error) => {
      console.error('Error creating agreement:', error);
      toast.error(`Failed to create agreement: ${error.message}`);
    }
  });

  // Update an existing agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SimpleAgreement> }) => {
      const { data: updatedData, error } = await supabase
        .from('leases')
        .update(data)
        .eq('id', id)
        .select();
        
      if (error) {
        throw error;
      }
      
      return updatedData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully');
    },
    onError: (error) => {
      console.error('Error updating agreement:', error);
      toast.error(`Failed to update agreement: ${error.message}`);
    }
  });

  // Delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting agreement:', error);
      toast.error(`Failed to delete agreement: ${error.message}`);
    }
  });

  return {
    agreements: data || [],
    isLoading,
    error,
    refetch,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    searchParams,
    setSearchParams
  };
};
