
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementFilters } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

export const useAgreements = (initialFilters: AgreementFilters = {}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  
  // Fetch agreements with filters
  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      let query = supabase
        .from('agreements')
        .select(`
          *,
          customers(id, full_name, email),
          vehicles(id, make, model, license_plate, image_url)
        `);
      
      // Apply filters
      if (searchParams.query) {
        query = query.or(`agreement_number.ilike.%${searchParams.query}%,customers.full_name.ilike.%${searchParams.query}%`);
      }
      
      if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('status', searchParams.status);
      }
      
      if (searchParams.customer_id) {
        query = query.eq('customer_id', searchParams.customer_id);
      }
      
      if (searchParams.vehicle_id) {
        query = query.eq('vehicle_id', searchParams.vehicle_id);
      }
      
      // Get the data
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching agreements:", error);
        toast.error("Failed to load agreements");
        return [];
      }
      
      return data || [];
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    }
  );
  
  // Create agreement
  const createAgreement = useApiMutation(
    async (agreement: Omit<Agreement, 'id'>) => {
      const { data, error } = await supabase
        .from('agreements')
        .insert(agreement)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating agreement:", error);
        throw new Error(error.message);
      }
      
      return data;
    },
    {
      onSuccess: () => {
        toast.success("Agreement created successfully");
        refetch();
      }
    }
  );
  
  // Update agreement
  const updateAgreement = useApiMutation(
    async ({ id, data }: { id: string, data: Partial<Agreement> }) => {
      const { data: updatedData, error } = await supabase
        .from('agreements')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating agreement:", error);
        throw new Error(error.message);
      }
      
      return updatedData;
    },
    {
      onSuccess: () => {
        toast.success("Agreement updated successfully");
        refetch();
      }
    }
  );
  
  // Delete agreement
  const deleteAgreement = useApiMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting agreement:", error);
        throw new Error(error.message);
      }
      
      return id;
    },
    {
      onSuccess: () => {
        toast.success("Agreement deleted successfully");
        refetch();
      }
    }
  );
  
  // Get agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    const { data, error } = await supabase
      .from('agreements')
      .select(`
        *,
        customers(id, full_name, email, phone),
        vehicles(id, make, model, license_plate, image_url, year, color)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error("Error fetching agreement:", error);
      toast.error("Failed to load agreement details");
      return null;
    }
    
    return data;
  };
  
  return {
    agreements,
    isLoading,
    searchParams,
    setSearchParams,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getAgreement,
    refetch
  };
};
