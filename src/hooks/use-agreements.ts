
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type for agreement search parameters that avoids deep recursion
export interface AgreementSearchParams {
  query?: string;
  status?: string;
  vehicleId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

// Define what an agreement looks like (simplified version to avoid recursion)
export interface Agreement {
  id: string;
  customerName?: string;
  customerContact?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  status?: string;
  licensePlate?: string;
  vehicleId?: string;
  customerId?: string;
  // Add other fields as needed, but don't create recursive references
}

export function useAgreements(initialParams?: Partial<AgreementSearchParams>) {
  const [searchParams, setSearchParams] = useState<AgreementSearchParams>({
    query: initialParams?.query || '',
    status: initialParams?.status || 'all',
    page: initialParams?.page || 1,
    limit: initialParams?.limit || 10,
    vehicleId: initialParams?.vehicleId,
    customerId: initialParams?.customerId
  });

  const queryClient = useQueryClient();

  // Main query for agreement list
  const {
    data: agreements,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      try {
        let query = supabase.from('leases').select(`
          *,
          vehicles(id, make, model, licensePlate),
          customers(id, firstName, lastName, phone)
        `);

        // Apply filters
        if (searchParams.query) {
          query = query.or(
            `vehicles.licensePlate.ilike.%${searchParams.query}%,customers.firstName.ilike.%${searchParams.query}%,customers.lastName.ilike.%${searchParams.query}%`
          );
        }

        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.vehicleId) {
          query = query.eq('vehicleId', searchParams.vehicleId);
        }
        
        if (searchParams.customerId) {
          query = query.eq('customerId', searchParams.customerId);
        }

        // Apply pagination
        const from = (searchParams.page! - 1) * searchParams.limit!;
        const to = from + searchParams.limit! - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        console.error('Error fetching agreements:', error.message);
        throw new Error(error.message);
      }
    },
  });

  // Function to get a specific agreement
  const getAgreementById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          vehicles(id, make, model, licensePlate, year, color, dailyRate),
          customers(id, firstName, lastName, email, phone, idNumber),
          lease_payments(id, amount, status, dueDate, paymentDate, notes, paymentMethod)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching agreement:', error.message);
      throw new Error(error.message);
    }
  };

  // Query for a specific agreement
  const useAgreement = (id?: string) => {
    return useQuery({
      queryKey: ['agreement', id],
      queryFn: () => getAgreementById(id!),
      enabled: !!id,
    });
  };

  // Mutation for updating agreement
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      try {
        const { data: updatedData, error } = await supabase
          .from('leases')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return updatedData;
      } catch (error: any) {
        console.error('Error updating agreement:', error.message);
        throw new Error(error.message);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', data.id] });
      toast.success('Agreement updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update agreement: ${error.message}`);
    },
  });

  // Function to update agreement status
  const updateAgreementStatus = (id: string, status: string) => {
    return updateAgreementMutation.mutate({ id, data: { status } });
  };

  // Mutation for deleting an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete agreement: ${error.message}`);
    }
  });

  // Fetch on mount and when search params change
  useEffect(() => {
    refetch();
  }, [searchParams, refetch]);

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreementById,
    useAgreement,
    updateAgreementMutation,
    updateAgreementStatus,
    deleteAgreement,
    getAgreement: getAgreementById // Alias to maintain backward compatibility
  };
}
