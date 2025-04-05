
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Define the SimpleAgreement interface that was referenced but not defined
export interface SimpleAgreement {
  id: string;
  agreement_number: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date: string | Date;
  end_date: string | Date;
  status: string;
  total_amount: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  total_cost?: number;
  rent_amount?: number;
  deposit_amount?: number;
  daily_late_fee?: number;
  notes?: string;
  terms_accepted?: boolean;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    color?: string;
    year?: number;
    vin?: string;
  };
  vehicles?: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    color?: string;
    year?: number;
    vin?: string;
  };
  customer?: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
  };
  customers?: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
  };
}

export const useAgreements = (options: {
  customerId?: string;
  vehicleId?: string;
  page?: number;
  pageSize?: number;
  columns?: string;
  status?: string; // Added status parameter
  query?: string; // Added query parameter
} = {}) => {
  const queryClient = useQueryClient();
  const { customerId, vehicleId, page = 1, pageSize = 10, columns, status, query } = options;
  const [searchParams, setSearchParams] = useState({ status: 'all', query: '' });

  // Calculate pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Create a cache key that includes pagination and filter parameters
  const cacheKey = ['agreements', customerId, vehicleId, page, pageSize, searchParams.status, searchParams.query];
  
  // Default columns to select if not specified - optimized to select only what's needed
  const defaultColumns = 'id,agreement_number,customer_id,vehicle_id,start_date,end_date,status,total_amount,created_at,updated_at';
  const vehicleColumns = 'id,make,model,license_plate';
  const selectColumns = columns || `${defaultColumns},vehicle:vehicle_id(${vehicleColumns})`;
  
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
        
        // Add status filtering if provided
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        // Add search query filtering if provided
        if (searchParams.query) {
          query = query.or(`agreement_number.ilike.%${searchParams.query}%`);
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache time for better performance
    refetchOnWindowFocus: false // Disable automatic refetching when window regains focus
  });

  // Get a single agreement by ID with optimized column selection
  const getAgreement = async (id: string, selectColumns?: string) => {
    try {
      // Define default columns with just essential data
      const defaultDetailColumns = 'id,agreement_number,customer_id,vehicle_id,start_date,end_date,status,total_amount,created_at,updated_at';
      const customerColumns = 'id,full_name,email,phone_number';
      const vehicleColumns = 'id,make,model,license_plate,color,year,vin';
      
      // Use provided columns or default to our optimized selection
      const columns = selectColumns || 
        `${defaultDetailColumns},vehicle:vehicle_id(${vehicleColumns}),customer:customer_id(${customerColumns})`;
      
      // Check cache first for better performance
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
    searchParams,
    setSearchParams
  };
};
