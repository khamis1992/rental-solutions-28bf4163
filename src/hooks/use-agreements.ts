
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement, agreementSchema } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { FlattenType } from '@/utils/type-utils';

// Define SimpleAgreement type to fix import errors across components
export type SimpleAgreement = {
  id?: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  total_amount: number;
  status: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  customers?: { id: string; full_name: string; [key: string]: any };
  vehicles?: { id: string; make: string; model: string; license_plate: string; [key: string]: any };
  [key: string]: any;
};

// Remove recursive type and simplify
export function useAgreements(params?: { query?: string; status?: string; vehicle_id?: string; customer_id?: string }) {
  const queryClient = useQueryClient();

  const getAgreements = async (): Promise<SimpleAgreement[]> => {
    const { data, error } = await supabase
      .from('leases')
      .select('*, customers(full_name), vehicles(make, model, license_plate)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  };

  // Add search and filter functionality for AgreementList
  const [searchParams, setSearchParams] = useState(params || { query: '', status: 'all' });
  const [agreements, setAgreements] = useState<SimpleAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to fetch agreements with filters
  const fetchAgreements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('leases')
        .select('*, customers(full_name), vehicles(make, model, license_plate)')
        .order('created_at', { ascending: false });
      
      if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('status', searchParams.status);
      }
      
      if (searchParams.query) {
        const searchTerm = searchParams.query.toLowerCase();
        
        // First get matching customers
        const { data: customerMatches, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .ilike('full_name', `%${searchTerm}%`);
          
        if (customerError) throw new Error(customerError.message);
        
        // Then get matching vehicles
        const { data: vehicleMatches, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .ilike('license_plate', `%${searchTerm}%`);
          
        if (vehicleError) throw new Error(vehicleError.message);
        
        const customerIds = customerMatches.map(c => c.id);
        const vehicleIds = vehicleMatches.map(v => v.id);
        
        if (customerIds.length > 0 || vehicleIds.length > 0) {
          if (customerIds.length > 0) {
            query = query.in('customer_id', customerIds);
          }
          
          if (vehicleIds.length > 0) {
            // If we have both customer and vehicle matches, we need to use OR
            if (customerIds.length > 0) {
              const { data: customerResults } = await query;
              
              const vehicleQuery = supabase
                .from('leases')
                .select('*, customers(full_name), vehicles(make, model, license_plate)')
                .in('vehicle_id', vehicleIds)
                .order('created_at', { ascending: false });
                
              if (searchParams.status && searchParams.status !== 'all') {
                vehicleQuery.eq('status', searchParams.status);
              }
              
              const { data: vehicleResults, error: vehicleQueryError } = await vehicleQuery;
              
              if (vehicleQueryError) throw new Error(vehicleQueryError.message);
              
              // Merge and deduplicate results
              const allResults = [...(customerResults || []), ...(vehicleResults || [])];
              const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
              
              setAgreements(uniqueResults);
              setIsLoading(false);
              return;
            } else {
              query = query.in('vehicle_id', vehicleIds);
            }
          }
        } else {
          // If no matches, return empty array
          setAgreements([]);
          setIsLoading(false);
          return;
        }
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw new Error(fetchError.message);
      
      setAgreements(data || []);
    } catch (err: any) {
      console.error('Error fetching agreements:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setAgreements([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);
  
  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const useAgreementsQuery = () =>
    useQuery({
      queryKey: ['agreements'],
      queryFn: getAgreements,
      placeholderData: [],
    });

  const createAgreement = useMutation({
    mutationFn: async (newAgreement: Agreement) => {
      const result = agreementSchema.safeParse(newAgreement);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
        throw new Error("Validation failed. Check console for details.");
      }
      
      const { data, error } = await supabase
        .from('leases')
        .insert([newAgreement])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create agreement: ${error.message}`);
    },
  });

  const updateAgreement = useMutation({
    mutationFn: async (agreementUpdate: Agreement) => {
      const result = agreementSchema.safeParse(agreementUpdate);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
        throw new Error("Validation failed. Check console for details.");
      }
      
      const { data, error } = await supabase
        .from('leases')
        .update(agreementUpdate)
        .eq('id', agreementUpdate.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update agreement: ${error.message}`);
    },
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete agreement: ${error.message}`);
    },
  });
  
  const getAgreement = async (id: string) => {
    const { data } = await supabase
      .from('leases')
      .select('*, customers(*), vehicles(*)')
      .eq('id', id)
      .single();
    return data;
  }

  return {
    useAgreementsQuery,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getAgreement,
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams
  };
}
