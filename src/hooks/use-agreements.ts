
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

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
export const useAgreements = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<SearchParams>({
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
  
  // Query to fetch a single agreement by ID
  const useAgreement = (id: string) => {
    return useQuery({
      queryKey: ['agreement', id],
      queryFn: async () => {
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
      },
      enabled: Boolean(id)
    });
  };
  
  // Mutation to create a new agreement
  const useCreate = () => {
    return useMutation({
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
  };
  
  // Mutation to update an existing agreement
  const useUpdate = () => {
    return useMutation({
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
  };
  
  // Mutation to delete an agreement
  const useDelete = () => {
    return useMutation({
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
  };
  
  // Query for fetching import history
  const useImportHistory = () => {
    return useQuery({
      queryKey: ['agreement-imports'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('agreement_imports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) {
          throw new Error(`Error fetching import history: ${error.message}`);
        }
        
        return data || [];
      }
    });
  };

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

  // Function to delete an agreement
  const deleteAgreement = async (id: string) => {
    const { error } = await supabase
      .from('rental_agreements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting agreement: ${error.message}`);
    }

    queryClient.invalidateQueries({ queryKey: ['agreements'] });
    return id;
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

  // Return all the queries and mutations
  return {
    useAgreementsList,
    useAgreement,
    useCreate,
    useUpdate,
    useDelete,
    useImportHistory,
    searchParams,
    setSearchParams,
    // Add direct access methods to fix errors
    getAgreement,
    deleteAgreement,
    getAgreements
  };
};
