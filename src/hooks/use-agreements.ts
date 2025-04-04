
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

// Define the SimpleAgreement interface that was missing
export interface SimpleAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  deposit_amount: number;
  agreement_number: string;
  notes: string;
  rent_amount?: number;
  daily_late_fee?: number;
  customer?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
  };
  payments?: Array<any>;
}

// Define the search parameters interface
interface SearchParams {
  query?: string;
  status?: string;
  customerId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

// Main hook for agreements
export const useAgreements = (initialParams?: SearchParams) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams || {
    query: '',
    status: 'all'
  });
  
  // Query to fetch agreement data based on search parameters
  const useAgreementsList = () => {
    return useQuery({
      queryKey: ['agreements', searchParams],
      queryFn: async () => {
        let query = supabase
          .from('rental_agreements')
          .select(`
            *,
            customer:customer_id(*),
            vehicle:vehicle_id(*)
          `)
          .order('created_at', { ascending: false });
          
        // Apply filters based on search parameters
        if (searchParams.query && searchParams.query.trim() !== '') {
          query = query.or(`
            customer.full_name.ilike.%${searchParams.query}%,
            customer.phone.ilike.%${searchParams.query}%,
            vehicle.license_plate.ilike.%${searchParams.query}%
          `);
        }
        
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customerId) {
          query = query.eq('customer_id', searchParams.customerId);
        }
        
        if (searchParams.vehicleId) {
          query = query.eq('vehicle_id', searchParams.vehicleId);
        }
        
        // Date range filtering if provided
        if (searchParams.startDate) {
          query = query.gte('start_date', searchParams.startDate);
        }
        
        if (searchParams.endDate) {
          query = query.lte('end_date', searchParams.endDate);
        }
        
        const { data, error } = await query;
          
        if (error) {
          throw new Error(`Error fetching agreements: ${error.message}`);
        }
        
        return data || [];
      }
    });
  };
  
  // Get agreements using the query hook
  const agreementsQuery = useAgreementsList();
  
  // Mutation to create a new agreement
  const createAgreement = useMutation({
    mutationFn: async (agreementData: any) => {
      const { data, error } = await supabase
        .from('rental_agreements')
        .insert(agreementData)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating agreement: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    }
  });
  
  // Mutation to update an existing agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updatedData, error } = await supabase
        .from('rental_agreements')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating agreement: ${error.message}`);
      }
      
      return updatedData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Agreement updated successfully');
    }
  });
  
  // Mutation to delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rental_agreements')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(`Error deleting agreement: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.removeQueries({ queryKey: ['agreement', id] });
      toast.success('Agreement deleted successfully');
    }
  });

  // Function to get a single agreement by ID
  const getAgreement = async (id: string) => {
    if (!id) return null;

    const { data, error } = await supabase
      .from('rental_agreements')
      .select(`
        *,
        customer:customer_id(*),
        vehicle:vehicle_id(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching agreement: ${error.message}`);
    }

    return data;
  };

  // Function to get all agreements
  const getAgreements = async (filters?: any) => {
    let query = supabase
      .from('rental_agreements')
      .select(`
        *,
        customer:customer_id(*),
        vehicle:vehicle_id(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching agreements: ${error.message}`);
    }

    return data || [];
  };

  // Return an object with clear properties for agreements, isLoading, error etc.
  return {
    // Query result properties
    agreements: agreementsQuery.data,
    isLoading: agreementsQuery.isLoading,
    error: agreementsQuery.error,
    
    // Query functions
    useAgreementsList,
    
    // Direct methods
    getAgreement,
    getAgreements,
    
    // Mutations
    createAgreement,
    updateAgreement,
    deleteAgreement,
    
    // Search params state
    searchParams,
    setSearchParams,
  };
};
