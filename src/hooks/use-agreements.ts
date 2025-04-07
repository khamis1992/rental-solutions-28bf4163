
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create a simplified agreement type to avoid recursion issues
export interface SimpleAgreement {
  id: string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  total_amount?: number;
  payment_status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  deposit_amount?: number;
  notes?: string;
  lease_number?: string;
  agreement_number?: string;
  rent_amount?: number;
  daily_late_fee?: number;
  
  // References to related objects
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    license_plate?: string;
    color?: string;
    year?: number;
  };
  
  customers?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    driver_license?: string;
  };
}

export interface AgreementSearchParams {
  query?: string;
  status?: string;
  customer_id?: string;
  vehicle_id?: string;
}

export function useAgreements(initialParams?: AgreementSearchParams) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<AgreementSearchParams>(initialParams || {
    query: '',
    status: 'all'
  });

  // Fetch all agreements
  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      try {
        let query = supabase
          .from('leases')
          .select(`
            *,
            vehicles(*),
            customers(*)
          `)
          .order('created_at', { ascending: false });
          
        // Apply filters based on search params
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customer_id);
        }
        
        if (searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicle_id);
        }
        
        if (searchParams.query) {
          query = query.or(`
            customers.full_name.ilike.%${searchParams.query}%,
            vehicles.license_plate.ilike.%${searchParams.query}%,
            agreement_number.ilike.%${searchParams.query}%
          `);
        }
          
        const { data, error } = await query;
          
        if (error) throw error;
        return data as SimpleAgreement[];
      } catch (error) {
        console.error("Error fetching agreements:", error);
        throw error; // Re-throw to let React Query handle it
      }
    }
  });

  // Get agreement details
  const getAgreementDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          vehicles(*),
          customers(*)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agreement details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Get agreement by ID
  const getAgreement = async (id: string) => {
    return getAgreementDetails(id);
  };

  // Create new agreement
  const createAgreement = useMutation({
    mutationFn: async (agreementData: Partial<SimpleAgreement>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .insert([agreementData])
          .select();
          
        if (error) throw error;
        return data[0];
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement created successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error creating agreement:', error);
      toast.error(`Failed to create agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...agreementData }: { id: string } & Partial<SimpleAgreement>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .update(agreementData)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return data[0];
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error updating agreement:', error);
      toast.error(`Failed to update agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return id;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error deleting agreement:', error);
      toast.error(`Failed to delete agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    agreements,
    isLoading: isLoading || loading,
    error,
    searchParams,
    setSearchParams,
    getAgreementDetails,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement
  };
}
